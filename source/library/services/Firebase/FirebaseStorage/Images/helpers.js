

    /**
     * @description Uploads an image via AccountServer signed URL
     * @deprecated Use FirestoreImage.uploadToFirebase() instead
     * @param {string} dataUrl - The image data URL
     * @param {string} filename - Optional filename
     * @returns {Promise<Object>} Object with publicUrl and metadata
     * @category Upload
     */
    async uploadImage (dataUrl, filename = null) {
        await this.initializeFirebase();

        if (!dataUrl || !dataUrl.startsWith('data:')) {
            throw new Error("Invalid data URL");
        }

        // Generate filename if not provided
        if (!filename) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            filename = `image_${timestamp}_${random}.png`;
        }

        // Construct the full path
        const fullPath = `${this.uploadPath()}/${filename}`;

        // Convert data URL to blob
        const blob = await this.dataUrlToBlob(dataUrl);

        // Get storage reference
        const storageRef = this.firebaseStorage().ref();
        const imageRef = storageRef.child(fullPath);

        // Upload the blob
        const snapshot = await imageRef.put(blob, {
            contentType: blob.type,
            customMetadata: {
                uploadedAt: new Date().toISOString(),
                source: 'undreamedof-ai'
            }
        });

        // Get the public download URL
        const publicUrl = await snapshot.ref.getDownloadURL();

        return {
            publicUrl: publicUrl,
            fullPath: fullPath,
            filename: filename,
            size: snapshot.totalBytes,
            contentType: snapshot.metadata.contentType,
            timeCreated: snapshot.metadata.timeCreated,
            metadata: snapshot.metadata
        };
    }

    /**
     * @description Converts a data URL to a Blob
     * @param {string} dataUrl - The data URL
     * @returns {Promise<Blob>} The blob
     * @category Helper
     */
    async dataUrlToBlob (dataUrl) {
        return new Promise((resolve) => {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            resolve(new Blob([u8arr], { type: mime }));
        });
    }

    /**
     * @description Deletes an image from Firebase Storage
     * @param {string} fullPath - The full storage path
     * @returns {Promise<void>}
     * @category Delete
     */
    async deleteImage (fullPath) {
        await this.initializeFirebase();

        const storageRef = this.firebaseStorage().ref();
        const imageRef = storageRef.child(fullPath);

        await imageRef.delete();
    }

    /**
     * @description Gets metadata for an image
     * @param {string} fullPath - The full storage path
     * @returns {Promise<Object>} The metadata
     * @category Metadata
     */
    async getImageMetadata (fullPath) {
        await this.initializeFirebase();

        const storageRef = this.firebaseStorage().ref();
        const imageRef = storageRef.child(fullPath);

        const metadata = await imageRef.getMetadata();
        const publicUrl = await imageRef.getDownloadURL();

        return {
            publicUrl: publicUrl,
            fullPath: fullPath,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            customMetadata: metadata.customMetadata
        };
    }