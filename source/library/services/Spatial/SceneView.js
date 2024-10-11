"use strict";

/**
 * @module library.services.Spatial
 */

/**
 * @class SceneView
 * @extends NodeView
 * @classdesc Represents a 3D scene view using Babylon.js
 */
(class SceneView extends NodeView {
    
    initPrototypeSlots () {
        this.setElementType("canvas");
        /**
         * @member {String} dataUrl - The data URL for the scene
         */
        {
            const slot = this.newSlot("dataUrl", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Object} ajs - AssimpJS object
         */
        {
            const slot = this.newSlot("ajs", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {Object} engine - Babylon.js engine instance
         */
        {
            const slot = this.newSlot("engine", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {Object} scene - Babylon.js scene instance
         */
        {
            const slot = this.newSlot("scene", null);
            slot.setSlotType("Object");
        }
        /**
         * @member {Object} camera - Babylon.js camera instance
         */
        {
            const slot = this.newSlot("camera", null);
            slot.setSlotType("Object");
        }
        {
            //const slot = this.newSlot("clearColor", null);
            //slot.setSlotType("Object");
        }
        /**
         * @member {DomView} closeButtonView - Close button view
         */
        {
            const slot = this.newSlot("closeButtonView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {Boolean} isEditable - Indicates if the scene is editable
         */
        {
            const slot = this.newSlot("isEditable", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the SceneView
     * @returns {SceneView} The initialized SceneView instance
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setJustifyContent("center");
        this.setAlignItems("center");
        this.setOverflow("hidden");
        this.setWidth("100%");
        this.setHeight("100%");
        //this.setIsRegisteredForBrowserDrop(false);

        // close button
        const cb = this.newCloseButtonView();
        this.setCloseButtonView(cb);
        this.addSubview(cb);

        this.setIsEditable(false);
        this.dragUnhighlight();
        this.turnOffUserSelect();
        return this;
    }

    /**
     * @description Creates a new close button view
     * @returns {ButtonView} The created close button view
     */
    newCloseButtonView () {
        const v = ButtonView.clone().setElementClassName("ImageCloseButton")
        v.setDisplay("flex")
        v.setPosition("absolute")
        v.setTitleIsVisible(false)
        v.setTopPx(0)
        v.setRightPx(0)
        v.setTarget(this).setAction("close")
        v.setIconName("close")
        return v
    }

    /**
     * @description Sets whether the view is registered for browser drop events
     * @param {Boolean} aBool - Whether to register for browser drop events
     * @throws {Error} Always throws an error as this method shouldn't be called
     */
    setIsRegisteredForBrowserDrop(aBool) {
        throw new Error("shouldn't be called")
    }

    /**
     * @description Sets whether the scene is editable
     * @param {Boolean} aBool - Whether the scene is editable
     * @returns {SceneView} The SceneView instance
     */
    setIsEditable (aBool) {
        this.closeButtonView().setIsDisplayHidden(!aBool)
        return this
    }

    /**
     * @description Sets whether the scene is editable (placeholder method)
     * @param {Boolean} aBool - Whether the scene is editable
     * @returns {SceneView} The SceneView instance
     */
    setEditable (aBool) {
        // to avoid editable content?
        return this
    }
    
    /**
     * @description Checks if the view accepts drops
     * @returns {Boolean} Always returns false
     */
    acceptsDrop () {
        return false
    }

    /**
     * @description Collapses the view
     */
    collapse () {
        this.closeButtonView().setOpacity(0).setTarget(null)
        this.setOpacity(0)
		
        this.setWidth("0px")
		
        this.setPaddingLeftPx(0)
        this.setPaddingRightPx(0)
		
        this.setMarginLeft(0)
        this.setMarginRightPx(0)
    }
    
    /**
     * @description Closes the view with animation
     */
    close () {
        const seconds = 0.3
		
        this.collapse()
        
        this.addTimeout( () => { 
            this.closeButtonView().hideDisplay()
            const parentView = this.parentView()
            this.removeFromParentView()
            parentView.scheduleSyncToNode()
        }, seconds * 1000)
    }

    /**
     * @description Gets the canvas element
     * @returns {HTMLCanvasElement} The canvas element
     */
    canvas () {
        return this.element();
    }

    /**
     * @description Sets up the scene view
     */
    async setup () {
        const AssimpJS = await assimpjs();
        await this.setupEngine();
        await this.setupScene();
        await this.setupCamera();

    }

    /**
     * @description Sets up the Babylon.js engine
     */
    async setupEngine () {
        const engine = new BABYLON.Engine(this.canvas(), true);
        this.setEngine(engine);
                    
        // Render loop
        engine.runRenderLoop(function () {
            scene.render();
        });
        
        // Resize the engine on window resize
        window.addEventListener('resize', function () {
            engine.resize();
        });
    }

    /**
     * @description Sets up the Babylon.js scene
     */
    async setupScene () {
        const scene = new BABYLON.Scene(this.engine());
        this.setScene(scene);

        const c = 0.5;
        var blueprintColor = new BABYLON.Color4(0.2*c, 0.6*c, 0.8*c, 1); // Blueprint blue color
        scene.clearColor = blueprintColor;
    }

    /**
     * @description Sets up the Babylon.js camera
     */
    async setupCamera () {
        const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(-500, 200, 800), this.scene());
        this.setCamera(camera);

        camera.attachControl(this.canvas(), true);
        camera.target = new BABYLON.Vector3(-500, 0, 0);
    }

    /**
     * @description Sets up the Babylon.js light
     */
    async setupLight () {
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene());
    }    

    /**
     * @description Fetches an array buffer for a given file path
     * @param {String} path - The file path
     * @returns {Promise<ArrayBuffer>} The array buffer of the file
     */
    async arrayBufferForFilePath (path) {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
    }

    /**
     * @description Loads the 3D model
     */
    async loadModel () {
        const filePaths = ["main house.obj", "main house.mtl"];

        const arrayBuffers = this.map(async (path) => {
            return this.arrayBufferForFilePath(path)
        });

        // create new file list object, and add the files
        const fileList = new ajs.FileList ();
        for (let i = 0; i < files.length; i++) {
            fileList.AddFile (files[i], new Uint8Array (arrayBuffers[i]));
        }
        
        // convert file list to assimp json
        const result = ajs.ConvertFileList (fileList, 'assjson');
        
        // check if the conversion succeeded
        if (!result.IsSuccess () || result.FileCount () == 0) {
            resultDiv.innerHTML = result.GetErrorCode ();
            return;
        }

        // get the result file, and convert to string
        const objFile = result.GetFile (0);
        const objJsonContent = new TextDecoder().decode(objFile.GetContent());
        const objJson = JSON.parse(objJsonContent);

        // --------------------------------------------------------------------
        const redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
        redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); 

        const roofMaterial = new BABYLON.StandardMaterial("roofMaterial", scene);
        roofMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); 

        const windowSlatsMaterial = new BABYLON.StandardMaterial("windowSlatsMaterial", scene);
        windowSlatsMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); 

        const stoneMaterial = new BABYLON.StandardMaterial("stoneMaterial", scene);
        stoneMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); 

        

        const wallsMaterial = new BABYLON.StandardMaterial("wallsMaterial", scene);
        wallsMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); 

        const deckMaterial = new BABYLON.StandardMaterial("deckMaterial", scene);
        deckMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // A shade of brown


        const windowMaterial = new BABYLON.StandardMaterial("windowMaterial", scene);
        windowMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); 
        windowMaterial.alpha = 0.4;

        const windowFrameMaterial = new BABYLON.StandardMaterial("windowFrameMaterial", scene);
        windowFrameMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); 

        const grassMaterial = new BABYLON.StandardMaterial("grassMaterial", scene);
        grassMaterial.diffuseColor = new BABYLON.Color3(0, 0.3, 0); 
        grassMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Minimal specular highlights
        grassMaterial.specularPower = 128; 


        //grassMaterial.diffuseTexture = new BABYLON.Texture("Grass_Light_Green.jpg", scene);

        // Assuming `objJson` is your parsed JSON from AssimpJS
        objJson.meshes.forEach(meshData => {
            const vertices = meshData.vertices;
            const indices = [].concat(...meshData.faces); // Flatten the faces array
            const normals = meshData.normals;
            const uvs = meshData.texturecoords && meshData.texturecoords[0] ? meshData.texturecoords[0] : []; // Check and provide default if needed

            const mesh = new BABYLON.Mesh("meshName", scene);
            mesh.scaling.x = -1;

            const vertexData = new BABYLON.VertexData();

            vertexData.positions = vertices;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            vertexData.applyToMesh(mesh);

            // Apply materials if available
            if (meshData.materialindex !== undefined && objJson.materials) {
                const materialData = objJson.materials[meshData.materialindex];
                //console.log("meshData.materialindex: ", meshData.materialindex);
                const material = new BABYLON.StandardMaterial("materialName", scene);
                mesh.material = material;
            }

            /*
            materialindex 
            1= decks, chimney
            2: stone wall
            3: grass
            4: windows
            5: window frames
            6: window slats
            7: roof
            */
            //mesh.material = wallsMaterial;    


            if (meshData.materialindex === 0) {
                console.log("meshData.materialindex:", meshData.materialindex);

                //mesh.material = wallsMaterial;    
            } else if (meshData.materialindex === 1) {
                mesh.material = deckMaterial;  
            } else if (meshData.materialindex === 2) {
                mesh.material = stoneMaterial;  
            } else if (meshData.materialindex === 3) {
                mesh.material = grassMaterial;
            } else if (meshData.materialindex === 4) {
                mesh.material = windowMaterial;
            } else if (meshData.materialindex === 5) {
                mesh.material = windowFrameMaterial;
            } else if (meshData.materialindex === 6) {
                mesh.material = windowSlatsMaterial;
            } else if (meshData.materialindex === 7) {
                //mesh.material = windowFrameMaterial;
                mesh.material = roofMaterial
            } else {
                console.log("meshData.materialindex:", meshData.materialindex);
                //mesh.material = redMaterial
            }
            
        });


        scene.meshes.forEach(function(mesh) {
            if(mesh.material){
                mesh.material.backFaceCulling = false;
            }
        });

    }

    /**
     * @description Sets up event listeners for the scene
     */
    async setupEvents () {
        // need to do this through our own event system
        // need to make sure events are registered with { passive: false } so we can prevent default
    }

    /**
     * @description Handles wheel events for zooming
     * @param {WheelEvent} event - The wheel event object
     */
    onWheel (event) {
        event.preventDefault(); // Prevent the default scroll behavior

        const delta = Math.sign(event.deltaY);
        const speed = 5; 
        this.camera().position.addInPlace(this.camera().getForwardRay().direction.scale(delta * speed));
        //}, { passive: false }); // Set passive to false to allow preventDefault
    }

    /**
     * @description Handles keydown events for camera movement
     * @param {KeyboardEvent} event - The keydown event object
     */

    onKeyDown (event) {
        event.preventDefault(); // Prevent the default scroll behavior

        const speed = 5; // Adjust the movement speed as needed
        console.log("event.key: ", event.key);
        if (event.key === "w") {
            camera.position.y -= speed; // Move camera forward
        } else if (event.key === "s") {
            camera.position.y += speed; // Move camera backward
        }

        // Calculate the right vector
        const forward = camera.getForwardRay().direction;
        const up = BABYLON.Vector3.Up();
        const right = BABYLON.Vector3.Cross(forward, up);

        if (event.key === "a") {
            //if (event.key === "ArrowLeft") {
            camera.position.subtractInPlace(right.scale(-speed)); // Move camera to the left
        } else if (event.key === "d") {
            camera.position.addInPlace(right.scale(-speed)); // Move camera to the right
        }
        //}, { passive: false }); // Prevent the default scroll behavior
    }
    
}.initThisClass());
