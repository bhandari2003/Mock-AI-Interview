/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgresql://ai-interview-mocker_owner:8yMfEP2ZDrul@ep-twilight-rice-a553owvl.us-east-2.aws.neon.tech/ai-interview-mocker?sslmode=require',
    }
};