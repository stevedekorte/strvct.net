"use strict";

(class SvImage_firestore extends SvImage {

    async asyncPublicFirestoreUrl () {
        const fbImage = await FirebaseStorageService.shared().images().asyncFirestoreImageForSvImage(this);
        return await fbImage.publicUrl();
    }

}).initThisCategory();

