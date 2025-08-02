// Test script to verify media association with activities
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk', {
  bufferCommands: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
});

// Test media association
async function testMediaAssociation() {
  try {
    console.log('Testing media association...');
    
    // Get the Media and TicketActivity models
    const Media = mongoose.model('Media');
    const TicketActivity = mongoose.model('TicketActivity');
    
    // Find a recent activity with attachments
    const activity = await TicketActivity.findOne({ 
      attachments: { $exists: true, $ne: [] } 
    }).sort({ createdAt: -1 });
    
    if (activity) {
      console.log('Found activity with attachments:', {
        activityId: activity._id,
        attachmentsCount: activity.attachments.length,
        attachments: activity.attachments
      });
      
      // Check if media is properly associated
      const media = await Media.find({
        'associatedWith.type': 'activity',
        'associatedWith.id': String(activity._id)
      });
      
      console.log('Associated media found:', media.length);
      media.forEach(m => {
        console.log('- Media:', m.filename, 'ID:', m._id);
      });
    } else {
      console.log('No activities with attachments found');
    }
    
    // Test FCM token schema
    const FCMToken = mongoose.model('FCMToken');
    console.log('FCM Token model loaded successfully');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testMediaAssociation();