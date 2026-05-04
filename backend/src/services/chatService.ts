import prisma from "../lib/prisma";

export const getMyChatRoomsService = async(userId : number) => {
    const tripRooms = await prisma.tripRoom.findMany({
        where:{
            members:{
                some:{
                    userId,
                },
            },
        },
        orderBy:{
            updatedAt:"desc",
        },
        select:{
            id:true,
            title:true,
            thumbnailUrl:true,
            updatedAt:true,
            chatRoom:{
                select:{
                    id: true,
                    updatedAt:true,
                    chatMessages:{
                        orderBy:{
                            createdAt:"desc",
                        },
                        take:1,
                        select:{
                            content:true,
                            createdAt:true,
                            senderUser:{
                                select:{
                                    name:true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return tripRooms.map((tripRoom)=>{
        const lastMessage = tripRoom.chatRoom?.chatMessages[0];

        return {
            chatRoomId: tripRoom.chatRoom?.id ?? null,
            tripRoomId: tripRoom.id,
            tripRoomTitle: tripRoom.title,
            thumbnailUrl: tripRoom.thumbnailUrl,
            lastMessage : lastMessage?{
                content:lastMessage.content,
                senderName: lastMessage.senderUser.name,
                createdAt : lastMessage.createdAt,
            }:null,
            updatedAt : tripRoom.chatRoom?.updatedAt ?? tripRoom.updatedAt,
        };
    });
};

export const getTripRoomChatMessagesService = async (tripRoomId:number, userId:number) => {
    const tripRoom = await prisma.tripRoom.findUnique({
        where:{id : tripRoomId},
        select:{
            id:true,
            title:true,
            chatRoom:{
                select:{
                    id:true,
                },
            },
        },
    });

    if(!tripRoom){
        return {
            found: false as const,
        };
    }
    const membership = await prisma.tripMember.findUnique({
        where:{
            tripRoomId_userId:{
                tripRoomId,
                userId,
            },
        },
        select:{
            id:true,
        },
    });

    if(!membership){
        return{
            found: true as const,
            authorized: false as const,
        };
    }

    if(!tripRoom.chatRoom){
        return{
            found:true as const,
            authorized: true as const,
            data:{
                tripRoomId,
                tripRoomTitle: tripRoom.title,
                chatMessages:[],
            },
        };
    }
    const messages = await prisma.chatMessage.findMany({
        where:{
            chatRoomId : tripRoom.chatRoom.id,
        },
        orderBy:{
            createdAt:"asc",
        },
        select:{
            id:true,
            content:true,
            createdAt:true,
            senderUser:{
                select:{
                    id:true,
                    name:true,
                },
            },
        },
    });
    return {
        found : true as const,
        authorized: true as const,
        data:{
            tripRoomId,
            tripRoomTitle: tripRoom.title,
            chatMessages: messages.map((message)=>({
                messageId: message.id,
                tripRoomId,
                sender:{
                    id:message.senderUser.id,
                    name:message.senderUser.name,
                },
                content : message.content,
                createdAt : message.createdAt,
            })),
        },
    };
};

export const sendTripRoomChatMessageService = async(tripRoomId: number , userId:number, content:string)=>{
    const trimmedContent = content.trim();

    if(!trimmedContent){
        throw new Error("Empty content");
    }

    const tripRoom = await prisma.tripRoom.findUnique({
        where : {id:tripRoomId},
        select:{
            id:true,
            chatRoom:{
                select:{
                    id:true,
                },
            },
        },
    });
    
    if(!tripRoom){
        throw new Error("Trip room not found");
    }
    
    const membership = await prisma.tripMember.findUnique({
        where:{
            tripRoomId_userId:{
                tripRoomId,
                userId,
            },
        },
        select:{
            id:true,
        },
    });

    if(!membership){
        throw new Error("Forbidden");
    }

    let chatRoomId = tripRoom.chatRoom?.id;

    if(!chatRoomId){
        const createdChatRoom = await prisma.chatRoom.create({
            data:{
                tripRoomId,
            },
            select:{
                id:true,
            },
        });
        chatRoomId = createdChatRoom.id;
    }

    const message = await prisma.chatMessage.create({
        data:{
            chatRoomId,
            senderUserId:userId,
            content:trimmedContent,
        },
        select:{
            id:true,
            content:true,
            createdAt:true,
            senderUser:{
                select:{
                    id:true,
                    name:true,
                },
            },
        },
    });

    return {
        messageId:message.id,
        tripRoomId,
        sender:{
            id:message.senderUser.id,
            name:message.senderUser.name,
        },
        content:message.content,
        createdAt:message.createdAt,
    };
};