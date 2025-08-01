// Migration script to add createdBy field to existing projects
const { MongoClient } = require('mongodb');

async function migrateProjects() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/tender-bidder-platform');
  
  try {
    await client.connect();
    const db = client.db();
    const projectsCollection = db.collection('projects');
    
    // Update all projects that have tenderId but no createdBy
    const result = await projectsCollection.updateMany(
      { 
        tenderId: { $exists: true },
        createdBy: { $exists: false }
      },
      { 
        $set: { 
          createdBy: "$tenderId",
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} projects with createdBy field`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateProjects();
}

module.exports = { migrateProjects };