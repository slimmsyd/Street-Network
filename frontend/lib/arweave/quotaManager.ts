export interface UserQuota {
    userId: string;
    totalStorage: number; // in bytes
    usedStorage: number; // in bytes
    transactionCount: number;
    lastUpdated: Date;
}

export interface QuotaCheck {
    canUpload: boolean;
    remainingStorage: number;
    message?: string;
}

export class QuotaManager {
    private static readonly DEFAULT_QUOTA = 1024 * 1024 * 100; // 100MB

    static async getUserQuota(userId: string): Promise<UserQuota> {
        // In production, this would fetch from your database
        // Placeholder implementation
        return {
            userId,
            totalStorage: this.DEFAULT_QUOTA,
            usedStorage: 0,
            transactionCount: 0,
            lastUpdated: new Date()
        };
    }

    static async checkQuota(userId: string, fileSize: number): Promise<QuotaCheck> {
        const quota = await this.getUserQuota(userId);
        const remainingStorage = quota.totalStorage - quota.usedStorage;

        if (fileSize > remainingStorage) {
            return {
                canUpload: false,
                remainingStorage,
                message: `Insufficient storage space. You have ${this.formatBytes(remainingStorage)} remaining.`
            };
        }

        return {
            canUpload: true,
            remainingStorage
        };
    }

    static async updateQuota(userId: string, uploadSize: number): Promise<void> {
        // In production, this would update your database
        // Placeholder implementation
        console.log(`Updated quota for user ${userId} with ${uploadSize} bytes`);
    }

    private static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
} 