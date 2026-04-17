export interface NotificationBean {    
    id: number,
    title: string,
    status: number,
    
    createdOn: string,
    isActive: number,

    toUserId: number,
    toUserName: string;
    fromUserId: number,
    fromUserName: string;
}