import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User
    @node
    @authorization(
      validate: [
        {
          operations: [UPDATE, DELETE]
          where: { node: { userId_EQ: "$jwt.sub" } }
        }
      ]
    ) {
    userId: ID! @id
    username: String!
    name: String!
    email: String!
    lastMessage: String
    roomId: String
    requestStatus: String
    friendsCount: Int
    groupsCount: Int
    preference: String

    answer: [Option!]! @relationship(type: "ANSWERED", direction: OUT)

    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT)

    sentRequests: [User!]! @relationship(type: "REQUESTED", direction: OUT)

    receivedRequests: [User!]! @relationship(type: "REQUESTED", direction: IN)
  }

  type Question @node {
    id: ID! @id
    text: String!
    options: [Option!]! @relationship(type: "HAS_OPTION", direction: OUT)
  }

  type Option @node {
    id: ID! @id
    value: String!
    question: [Question!]! @relationship(type: "HAS_OPTION", direction: IN)
  }

  type ChatRoom @node {
    id: ID! @id
    name: String!
    createdAt: DateTime! @timestamp(operations: [CREATE])
    isGroup: Boolean!
    members: [User!]! @relationship(type: "HAS_MEMBER", direction: IN)
    admins: [User!]! @relationship(type: "IS_ADMIN_OF", direction: IN)
  }

  type Query {
    getGroupMembers(groupId: String!): [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (g:ChatRoom {id: $groupId})
        WHERE (me)-[:HAS_MEMBER]->(g)
        MATCH (g)<-[:HAS_MEMBER]-(members:User)
        WHERE members <> me
        RETURN members
        """
        columnName: "members"
      )

    getAllGroups: [ChatRoom!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (me)-[:HAS_MEMBER]->(g:ChatRoom)
        WHERE g.isGroup = true
        RETURN g
        """
        columnName: "g"
      )

    getAllFriends: [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (me)-[:FRIENDS_WITH]->(friend:User)

        OPTIONAL MATCH (me)-[:HAS_MEMBER]->(room: ChatRoom)<-[:HAS_MEMBER]-(friend)
        WHERE room.isGroup = false
        RETURN friend { .*, roomId:room.id}
        """
        columnName: "friend"
      )

    getAllRequested: [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId : $jwt.sub})
        MATCH (me)-[:REQUESTED]->(requested:User)
        RETURN requested
        """
        columnName: "requested"
      )

    getAllRequests: [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId : $jwt.sub})
        MATCH (me)<-[:REQUESTED]-(requester:User)
        RETURN requester
        """
        columnName: "requester"
      )

    getRoomId(friendId: String!): String
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (friend:User {userId: $friendId})
        MATCH (me)-[:HAS_MEMBER]->(g:ChatRoom)<-[:HAS_MEMBER]-(friend)
        WHERE g.isGroup = false
        RETURN g.id AS roomId
        """
        columnName: "roomId"
      )

    getAllAdmins(groupId: String!): [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})-[:HAS_MEMBER]->(g:ChatRoom {id: $groupId})
        MATCH (u:User)-[:IS_ADMIN_OF]->(g)
        RETURN u
        """
        columnName: "u"
      )

    getAdminsToRemove(groupId: String!): [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (me)-[:IS_ADMIN_OF]->(g:ChatRoom {id: $groupId})
        MATCH (u:User)-[:IS_ADMIN_OF]->(g)
        WHERE u <> me
        RETURN u
        """
        columnName: "u"
      )

    getAllNonAdmins(groupId: String!): [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})-[:HAS_MEMBER]->(g:ChatRoom {id: $groupId})
        MATCH (u:User)-[:HAS_MEMBER]->(g)
        WHERE NOT (u)-[:IS_ADMIN_OF]->(g)
        RETURN u
        """
        columnName: "u"
      )

    getUserStats: User
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        OPTIONAL MATCH (me)-[:ANSWERED]->(o:Option)
        RETURN me {
          .*,
          friendsCount: size([(me)-[:FRIENDS_WITH]->(f:User) | f]),
          groupsCount: size([(me)-[:HAS_MEMBER]->(g:ChatRoom) WHERE g.isGroup = true | g]),
          preference: o.value
        }
        """
        columnName: "me"
      )

    isFriend(targetUserId: String!): Boolean
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (target:User {userId: $targetUserId})
        RETURN EXISTS( (me)-[:FRIENDS_WITH]-(target) ) AS isFriend
        """
        columnName: "isFriend"
      )

    getSuggestions(limit: Int = 10): [User!]!
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        CALL {
            WITH me
            // 1. INTEREST SCORING
            MATCH (me)-[:ANSWERED]->(o:Option)<-[:ANSWERED]-(u:User)
            WHERE u <> me
              AND NOT (me)-[:FRIENDS_WITH]-(u)
              AND NOT (me)-[:REQUESTED]->(u)
              AND NOT (u)-[:REQUESTED]->(me)
            RETURN u AS candidate, COUNT(o) * 3 AS score
          UNION
            WITH me
            // 2. SOCIAL SCORING (Friends of Friends)
            MATCH (me)-[:FRIENDS_WITH]-(mf:User)-[:FRIENDS_WITH]-(u:User)
            WHERE u <> me
              AND NOT (me)-[:FRIENDS_WITH]-(u)
              AND NOT (me)-[:REQUESTED]->(u)
              AND NOT (u)-[:REQUESTED]->(me)
            RETURN u AS candidate, COUNT(DISTINCT mf) * 10 AS score
        }

        // 3. AGGREGATE SCORES
        // This sums up scores if a user appears in BOTH lists
        WITH candidate, SUM(score) AS totalScore

        // 4. RETURN
        RETURN candidate
        ORDER BY totalScore DESC
        LIMIT $limit
        """
        columnName: "candidate"
      )
  }

  type Mutation {
    submitAnswer(optionId: String!): User
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (newOption:Option {id: $optionId})
        MATCH (newOption)<-[:HAS_OPTION]-(q:Question)
        OPTIONAL MATCH (me)-[r:ANSWERED]->(oldOption:Option)<-[:HAS_OPTION]-(q)
        DELETE r
        MERGE (me)-[:ANSWERED]->(newOption)
        RETURN me
        """
        columnName: "me"
      )

    createPrivateChat(partnerId: ID!): ChatRoom
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (partner:User {userId: $partnerId})

        WHERE (me)-[:FRIENDS_WITH]-(partner)
        // 1. Logic: Check if a PRIVATE room already exists between these two
        OPTIONAL MATCH (me)-[:HAS_MEMBER]->(existing:ChatRoom)<-[:HAS_MEMBER]-(partner)
        WHERE existing.isGroup = false

        WITH me, partner, head(collect(existing)) as foundRoom
        // 2. Logic: If foundRoom is NULL, create a new one
        FOREACH (_ IN CASE WHEN foundRoom IS NULL THEN [1] ELSE [] END |
          CREATE (newRoom:ChatRoom {
            id: randomUUID(),
            createdAt: datetime(),
            isGroup: false,
            name: "Private Chat"
          })
          MERGE (me)-[:HAS_MEMBER]->(newRoom)
          MERGE (partner)-[:HAS_MEMBER]->(newRoom)
        )
        // 3. Return: Fetch the room again (whether it was just created or already existed)
        WITH me, partner
        MATCH (me)-[:HAS_MEMBER]->(finalRoom:ChatRoom)<-[:HAS_MEMBER]-(partner)
        WHERE finalRoom.isGroup = false

        RETURN finalRoom
        """
        columnName: "finalRoom"
      )

    createGroupChat(name: String!, friendIds: [ID!]!): ChatRoom
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})

        // 1. Find the friends the user wants to add
        MATCH (friend:User)
        WHERE friend.userId IN $friendIds

        // 2. Security: Verify that 'me' is actually friends with EACH person
        //    This effectively filters out anyone who isn't a friend.
        AND (me)-[:FRIENDS_WITH]-(friend)

        WITH me, collect(friend) as validMembers

        // 3. Create the Group Room
        CREATE (g:ChatRoom {
          id: randomUUID(),
          name: $name,
          createdAt: datetime(),
          isGroup: true
        })

        // 4. Add the Creator (Me)
        MERGE (me)-[:HAS_MEMBER]->(g)
        MERGE (me)-[:IS_ADMIN_OF]->(g)

        // 5. Add the Friends
        FOREACH (f in validMembers | MERGE (f)-[:HAS_MEMBER]->(g))

        RETURN g
        """
        columnName: "g"
      )

    leaveGroup(groupId: ID!): Boolean
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (g:ChatRoom {id: $groupId})
        WHERE (me)-[:HAS_MEMBER]->(g)
        OPTIONAL MATCH (otherAdmin:User)-[:IS_ADMIN_OF]->(g)
        WHERE otherAdmin <> me
        WITH me, g, count(otherAdmin) as otherAdminCount
        WHERE NOT ((me)-[:IS_ADMIN_OF]->(g) AND otherAdminCount = 0)
        MATCH (me)-[r1:HAS_MEMBER]->(g)
        OPTIONAL MATCH (me)-[r2:IS_ADMIN_OF]->(g)
        DELETE r1, r2
        RETURN true AS result
        """
        columnName: "result"
      )

    deleteGroup(groupId: ID!): Boolean
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (g:ChatRoom {id: $groupId})
        WHERE (me)-[:IS_ADMIN_OF]->(g)
        WITH g, g.id as deletedId
        DETACH DELETE g
        RETURN true AS success
        """
        columnName: "success"
      )

    deletePrivateChat(partnerId: ID!): Boolean
      @cypher(
        statement: """
        MATCH (me:User {userId: $jwt.sub})
        MATCH (partner:User {userId: $partnerId})
        MATCH (me)-[:HAS_MEMBER]->(room:ChatRoom)<-[:HAS_MEMBER]-(partner)
        WHERE room.isGroup = false
        WITH room, room.id AS deletedRoomId
        DETACH DELETE room
        RETURN true AS success
        """
        columnName: "success"
      )
  }
`;
