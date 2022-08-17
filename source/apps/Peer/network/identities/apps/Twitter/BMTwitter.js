
"use strict";

/*

    BMTwitter

*/

(class BMTwitter extends BMApplet {
    
    initPrototypeSlots () {
        this.newSlot("feed", null)
        this.newSlot("notifications", null)
        this.newSlot("messages", null)
        this.newSlot("profile", null)
        this.newSlot("following", null)
        this.newSlot("followers", null)
    }

    init () {
        super.init()
        this.setTitle("Twitter")
        
        this.setFeed(BaseNode.clone())
        this.addSubnode(this.feed().setTitle("feed"))
                
        this.setNotifications(BaseNode.clone().setTitle("notifications"))
        this.addSubnode(this.notifications())

        this.setMessages(BaseNode.clone().setTitle("direct messages"))
        this.addSubnode(this.messages())
        
        this.setProfile(BaseNode.clone().setTitle("profile"))
        this.addSubnode(this.profile())

        this.setFollowing(BaseNode.clone().setTitle("following"))
        this.addSubnode(this.following())
        
        this.setFollowers(BaseNode.clone().setTitle("followers"))
        this.addSubnode(this.followers())
    }
    
    handleMessage (twitterMessage) {
        
        
    }
    
}.initThisClass());

