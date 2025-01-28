import Arweave from 'arweave';

// Initialize Arweave instance
export const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
});

// Constants for file upload
export const FILE_UPLOAD_SETTINGS = {
    maxFileSize: 100 * 1024 * 1024, // 100MB max file size
    allowedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'application/pdf',
        'text/plain'
    ],
};



// Tags for file uploads
export const createFileTags = (fileType: string, userId: string, familyId: string) => {
    return [
        { name: 'Content-Type', value: fileType },
        { name: 'App-Name', value: 'Lineage' },
        { name: 'User-Id', value: userId },
        { name: 'Family-Id', value: familyId },
        { name: 'Upload-Date', value: new Date().toISOString() },
    ];
}; 



