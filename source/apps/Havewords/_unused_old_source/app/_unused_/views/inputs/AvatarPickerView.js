"use strict";

/* 
    AvatarPickerView

*/

(class AvatarPickerView extends View {
  initPrototypeSlots() {
    this.newSlot("input", null);
    this.newSlot("image", null);
    this.newSlot("isEditable", false);
  }

  init() {
    super.init();
    this.create();
  }

  initElement() {
    super.initElement();
    const e = this.element()
    e.style.width = "fit-content";
    e.style.height = "fit-content";
    e.style.paddingTop = "0.5em";
    //e.style.border = "1px dashed red";

    this.setupAvatarInput();
    this.setupAvatarImage();
  }

  setupAvatarInput () {
    // Avatar input
    const input = document.createElement("input");
    this.setInput(input);
    input.style.display = "none";
    input.type = "file";
    input.id = "avatarInput";
    input.accept = "image/*";
    input.addEventListener("change", (event) => {
      this.handleAvatarChange(event);
    });
    this.element().appendChild(input);
  }

  setupAvatarImage() {
    const image = document.createElement("img");
    this.setImage(image);
    image.style.display = "block";
    image.className = "message-avatar";
    image.src = "resources/icons/default-avatar.png";
    image.addEventListener("click", () => {
      this.onClickAvatar();
    });
    this.element().appendChild(image);
  }

  setAvatarUrl (imageUrl) {
    //assert(imageUrl);
    if (imageUrl === "" || !imageUrl) {
      imageUrl = "resources/icons/default-avatar.png";
    }
    this.image().src = imageUrl;
    return this;
  }

  onClickAvatar () {
    if (this.isEditable()) {
      this.input().click();
    }
  }

  setString(s) {
    this.element().value = s;
    return this;
  }

  string() {
    return this.element().value;
  }

  async handleAvatarChange(event) {
    const file = event.target.files[0];
    const maxSizeInBytes = 100 * 1024; // 100 KB
    const targetWidth = 256;
    const targetHeight = 256;

    if (file) {
      const base64Image = await this.resizeImage(
        file,
        targetWidth,
        targetHeight
      );

      /*
      const imageSizeInBytes = atob(base64Image.split(",")[1]).length;

      if (imageSizeInBytes > maxSizeInBytes) {
        alert("Image size is too large. Please choose a smaller image.");
        return 
      } 
      */

      this.storeAvatar(base64Image);
      this.displayAvatar(base64Image);
    }
  }

  async resizeImage(file, targetWidth, targetHeight) {
    const image = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    return new Promise((resolve, reject) => {
      image.onload = () => {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        const resizedImage = canvas.toDataURL(file.type);
        resolve(resizedImage);
      };
      image.onerror = (error) => {
        reject(error);
      };
      image.src = URL.createObjectURL(file);
    });
  }

  storeAvatar(base64Image) {
    if (LocalUser.shared().avatar() !== base64Image) {
      LocalUser.shared().setAvatar(base64Image);

      App.shared().session().players().updatePlayerJson(LocalUser.shared().asPlayerJson());
      if (!App.shared().isHost()) {
        GuestSession.shared().sharePlayer();
      }
      GroupChatColumn.shared().addChatMessage(
        "chat",
        `You updated your avatar.`,
        LocalUser.shared().nickname(),
        LocalUser.shared().id()
      );

      //App.shared().session().players().scheduleOnChange();
    }
  }

  displayAvatar(base64Image) {
    if(base64Image) {
      this.image().src = base64Image;
    }
    /*
    this.avatarDisplay.style.display = "block";
    this.avatarInputLabel.style.display = "none";
    this.avatarInput.style.display = "none";
    */
  }
}).initThisClass();

AvatarPickerView.shared()