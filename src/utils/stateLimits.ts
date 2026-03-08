import { Message, TransferOffer } from '../../types';

export const MAX_STORED_MESSAGES = 240;
export const MAX_STORED_OFFERS = 80;

export const pruneMessages = (messages: Message[], maxMessages: number = MAX_STORED_MESSAGES): Message[] => {
    if (messages.length <= maxMessages) {
        return messages;
    }

    const unreadMessages = messages.filter(message => !message.isRead);
    const readMessages = messages.filter(message => message.isRead);
    const keepReadCount = Math.max(0, maxMessages - unreadMessages.length);
    const recentReadIds = new Set(readMessages.slice(-keepReadCount).map(message => message.id));

    return messages.filter(message => !message.isRead || recentReadIds.has(message.id)).slice(-maxMessages);
};

export const appendMessages = (existingMessages: Message[], incomingMessages: Message[]): Message[] => {
    if (incomingMessages.length === 0) {
        return pruneMessages(existingMessages);
    }

    return pruneMessages([...existingMessages, ...incomingMessages]);
};

export const prunePendingOffers = (offers: TransferOffer[], maxOffers: number = MAX_STORED_OFFERS): TransferOffer[] => {
    if (offers.length <= maxOffers) {
        return offers;
    }

    const pendingOffers = offers.filter(offer => offer.status === 'PENDING');
    const resolvedOffers = offers.filter(offer => offer.status !== 'PENDING');
    const keepResolvedCount = Math.max(0, maxOffers - pendingOffers.length);
    const recentResolvedIds = new Set(resolvedOffers.slice(-keepResolvedCount).map(offer => offer.id));

    return offers.filter(offer => offer.status === 'PENDING' || recentResolvedIds.has(offer.id)).slice(-maxOffers);
};

export const appendPendingOffers = (existingOffers: TransferOffer[], incomingOffers: TransferOffer[]): TransferOffer[] => {
    if (incomingOffers.length === 0) {
        return prunePendingOffers(existingOffers);
    }

    return prunePendingOffers([...existingOffers, ...incomingOffers]);
};