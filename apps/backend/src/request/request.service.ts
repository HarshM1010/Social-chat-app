import { Injectable, Inject } from '@nestjs/common';
import { Driver } from 'neo4j-driver';

@Injectable()
export class RequestService {
  constructor(@Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver) {}

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<{ userId: string; username: string; name: string } | null> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (sender:User {userId: $senderId})
        MATCH (receiver:User {userId: $receiverId})

        // Check if ANY relationship already exists
        OPTIONAL MATCH (sender)-[r:REQUESTED|FRIENDS_WITH]-(receiver)

        // Only create if 'r' is NULL
        FOREACH (_ IN CASE WHEN r IS NULL THEN [1] ELSE [] END |
          MERGE (sender)-[:REQUESTED]->(receiver)
        )

        RETURN sender.userId AS userId, sender.username AS username, sender.name AS name
        `,
        { senderId, receiverId },
      );
      if (result.records.length === 0) return null;
      const record = result.records[0];
      return {
        userId: record.get('userId'),
        username: record.get('username'),
        name: record.get('name'),
      };
    } finally {
      await session.close();
    }
  }

  async cancelFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
            MATCH (sender:User {userId: $senderId})
            MATCH (receiver:User {userId: $receiverId})
            MATCH (sender)-[r:REQUESTED]->(receiver)
            DELETE r
            RETURN true AS done
            `,
        { senderId, receiverId },
      );
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  async acceptFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
            MATCH (sender:User {userId: $senderId})
            MATCH (receiver:User {userId: $receiverId})
            MATCH (sender)-[r:REQUESTED]->(receiver)
            DELETE r
            MERGE (sender)-[:FRIENDS_WITH]->(receiver)
            MERGE (receiver)-[:FRIENDS_WITH]->(sender)
            RETURN true AS done
            `,
        { senderId, receiverId },
      );
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  async rejectFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
            MATCH (sender:User {userId: $senderId})
            MATCH (receiver:User {userId: $receiverId})
            MATCH (sender)-[r:REQUESTED]->(receiver)
            DELETE r
            RETURN true AS success
            `,
        { senderId, receiverId },
      );
      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }
}
