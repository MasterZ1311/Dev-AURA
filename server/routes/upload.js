import express from 'express';
const router = express.Router();

export default (bucket) => {
  // Generate a signed URL for client-side uploading
  router.post('/signed-url', async (req, res) => {
    try {
      const { fileName, fileType, folder = 'documents' } = req.body;
      const uid = req.user.uid;
      
      const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${uid}/${Date.now()}_${safeName}`;
      
      const file = bucket.file(filePath);
      
      const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType,
      };

      // Get a signed URL
      const [url] = await file.getSignedUrl(options);
      
      // Also return the public URL where the file will be accessible after upload
      // Note: Firebase Storage requires specific configuration to make it truly public 
      // via download URL without the token, but we can generate a long-lived read URL.
      const readOptions = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
      };
      const [readUrl] = await file.getSignedUrl(readOptions);

      res.json({
        uploadUrl: url,
        fileUrl: readUrl,
        filePath
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate signed URL' });
    }
  });

  return router;
};
