import { Injectable, Inject } from '@nestjs/common';
import { Driver } from 'neo4j-driver';

@Injectable()
export class UserService {
  constructor(@Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver) {}

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (sender:User {userId: $senderId})
        MATCH (receiver:User {userId: $receiverId})
        OPTIONAL MATCH (sender)-[r:REQUESTED|FRIENDS_WITH]-(receiver)
        FOREACH (_ IN CASE WHEN r IS NULL THEN [1] ELSE [] END |
          MERGE (sender)-[:REQUESTED]->(receiver)
        )
        RETURN true AS created
        `,
        { senderId, receiverId },
      );

      // If a record is returned, it means we created the relationship
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  async searchUsers(username: string, currentUserId: string) {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (me:User {userId: $currentUserId})
        MATCH (other:User)
        WHERE toLower(other.username) CONTAINS toLower($username)
          AND other.userId <> $currentUserId
        OPTIONAL MATCH (me)-[friendRel:FRIENDS_WITH]->(other)
        OPTIONAL MATCH (me)-[sentRel:REQUESTED]->(other)
        OPTIONAL MATCH (other)-[receivedRel:REQUESTED]->(me)

        RETURN other.userId AS userId, 
              other.username AS username, 
              other.name AS name,
              CASE 
                WHEN friendRel IS NOT NULL THEN 'FRIEND'
                WHEN sentRel IS NOT NULL THEN 'SENT'
                WHEN receivedRel IS NOT NULL THEN 'RECEIVED'
                ELSE 'NONE'
              END AS requestStatus
        LIMIT 10
        `,
        { currentUserId, username },
      );
      return result.records.map((record) => ({
        userId: record.get('userId'),
        username: record.get('username'),
        name: record.get('name'),
        requestStatus: record.get('requestStatus'),
      }));
    } finally {
      await session.close();
    }
  }
}
