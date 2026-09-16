/**
 * Kinetic Tech — Supabase Cloud Database Initializer & Migration Tool (Node.js)
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const ENV_FILE = path.join(ROOT_DIR, 'subtitle-service', '.env');
const SQL_FILE = path.join(__dirname, 'init_schema.sql');
const LOCAL_USERS_FILE = path.join(ROOT_DIR, '.local_users_db.json');

// Parse connection string
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL=') && !trimmed.startsWith('#')) {
            connectionString = trimmed.split('=', 2)[1].replace(/^["']|["']$/g, '');
            break;
        }
    }
}

if (!connectionString) {
    console.error('❌ [Error] DATABASE_URL is not configured.');
    console.error('👉 Please set DATABASE_URL environment variable or define it in subtitle-service/.env');
    console.error('   Example: DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"');
    process.exit(1);
}

console.log('════════════════════════════════════════════════════════');
console.log('🚀 INITIALIZING SUPABASE CLOUD DATABASE');
console.log('════════════════════════════════════════════════════════\n');
console.log('Target:', connectionString.replace(/:[^:@]+@/, ':****@'));

async function initSupabase() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000
    });

    try {
        console.log('\n1. Connecting to Supabase PostgreSQL...');
        await client.connect();
        const verRes = await client.query('SELECT version();');
        console.log('   ✅ Connected successfully!');
        console.log('   PostgreSQL version:', verRes.rows[0].version.split(',')[0]);

        console.log('\n2. Executing Schema DDL from init_schema.sql...');
        const sql = fs.readFileSync(SQL_FILE, 'utf8');
        await client.query(sql);
        console.log('   ✅ All tables, extensions, enums, and indexes created successfully!');

        console.log('\n3. Migrating Local Users to Supabase Cloud...');
        if (fs.existsSync(LOCAL_USERS_FILE)) {
            const localData = JSON.parse(fs.readFileSync(LOCAL_USERS_FILE, 'utf8'));
            let migratedCount = 0;

            for (const [emailKey, data] of Object.entries(localData)) {
                const email = emailKey.trim().toLowerCase();
                const u = data.user || {};
                const name = u.display_name || email.split('@')[0];
                const used = u.quota_used_seconds || 0;
                const limit = u.quota_limit_seconds || 3600;
                const pwdHash = data.passwordHash || '';

                const checkRes = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
                if (checkRes.rows.length === 0) {
                    await client.query(
                        `INSERT INTO users (email, password_hash, display_name, plan, quota_used_seconds, quota_limit_seconds)
                         VALUES ($1, $2, $3, 'free', $4, $5)`,
                        [email, pwdHash, name, used, limit]
                    );
                    migratedCount++;
                    console.log(`   ✅ Migrated user: ${email} (Used: ${used}s)`);
                } else {
                    console.log(`   • User already exists: ${email}`);
                }
            }
            console.log(`   Migrated ${migratedCount} new users.`);
        }

        console.log('\n4. Verifying Tables and Data...');
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('   Active tables in public schema:');
        tablesRes.rows.forEach(r => console.log(`     - ${r.table_name}`));

        const countRes = await client.query('SELECT COUNT(*) FROM users;');
        console.log(`\n   👥 Total users in Supabase Database: ${countRes.rows[0].count}`);

        const listRes = await client.query('SELECT email, display_name, quota_used_seconds, quota_limit_seconds, created_at FROM users LIMIT 10;');
        console.log('\n   Current Users:');
        listRes.rows.forEach(u => {
            console.log(`     • ${u.email} (${u.display_name}) - Quota: ${u.quota_used_seconds}/${u.quota_limit_seconds}s`);
        });

        console.log('\n════════════════════════════════════════════════════════');
        console.log('🎉 SUPABASE CLOUD DATABASE IS 100% READY AND LIVE!');
        console.log('════════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('\n❌ Error connecting or initializing Supabase:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.error('👉 Please check if the password for user "postgres" is correct in Supabase.');
        }
        process.exit(1);
    } finally {
        await client.end().catch(() => {});
    }
}

initSupabase();
