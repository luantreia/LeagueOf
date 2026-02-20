// MongoDB initialization script
db = db.getSiblingDB('leagueof');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      required: ['email', 'username', 'password'],
      properties: {
        email: { bsonType: 'string' },
        username: { bsonType: 'string' },
        password: { bsonType: 'string' }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

print('MongoDB initialized successfully');
