// import DataLoader from 'dataloader';
// import { Injectable, Scope } from '@nestjs/common';
// import { ChatService } from '../chat.service';

// @Injectable({ scope: Scope.REQUEST })
// export class LastMessageLoader {
//   public loader: DataLoader<string, any>;
//   constructor(private readonly chatService: ChatService) {}
//   this.loader = new DataLoader(async (roomIds: string[]) => {
//     // 1. Fetch all messages for these rooms in ONE query
//     // Implement 'getLatestMessagesBatch' in your service to use $in operator
//     const messages = await this.chatService.getLatestMessagesBatch(roomIds);
//     // 2. Map the results back to the order of roomIds
//     const messageMap = new Map(
//       messages.map((msg) => [String(msg.roomId), msg]),
//     );
//     return roomIds.map((id) => messageMap.get(String(id)) || null);
//   });
// }
