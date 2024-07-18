"use strict";

/*

    SceneView

*/

(class SceneView extends NodeView {
    
    initPrototypeSlots () {
        this.setElementType("canvas");
        {
            const slot = this.newSlot("dataUrl", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("ajs", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("engine", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("scene", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("camera", null);
            slot.setSlotType("Object");
        }
        {
            //const slot = this.newSlot("clearColor", null);
            //slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("closeButtonView", null);
            slot.setSlotType("DomView");
        }
        {
            const slot = this.newSlot("isEditable", false);
            slot.setSlotType("Boolean");
        }
    }

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

    setIsRegisteredForBrowserDrop(aBool) {
        throw new Error("shouldn't be called")
    }

    // --- editable ---
    
    setIsEditable (aBool) {
        this.closeButtonView().setIsDisplayHidden(!aBool)
        return this
    }

    setEditable (aBool) {
        // to avoid editable content?
        return this
    }
    
    acceptsDrop () {
        return false
    }

    // --- close button ---

    collapse () {
        this.closeButtonView().setOpacity(0).setTarget(null)
        this.setOpacity(0)
		
        this.setWidth("0px")
		
        this.setPaddingLeftPx(0)
        this.setPaddingRightPx(0)
		
        this.setMarginLeft(0)
        this.setMarginRightPx(0)
    }
    
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

    // --- sync ---

    canvas () {
        return this.element();
    }

    async setup () {
        const AssimpJS = await assimpjs();
        await this.setupEngine();
        await this.setupScene();
        await this.setupCamera();

    }

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

    async setupScene () {
        const scene = new BABYLON.Scene(this.engine());
        this.setScene(scene);

        const c = 0.5;
        var blueprintColor = new BABYLON.Color4(0.2*c, 0.6*c, 0.8*c, 1); // Blueprint blue color
        scene.clearColor = blueprintColor;
    }

    async setupCamera () {
        const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(-500, 200, 800), this.scene());
        this.setCamera(camera);

        camera.attachControl(this.canvas(), true);
        camera.target = new BABYLON.Vector3(-500, 0, 0);
    }

    async setupLight () {
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene());
    }    

    // --- loading ---------------------------------------


    async arrayBufferForFilePath (path) {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
    }

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

    // --- events ------------------------------------------------------------------
    
    async setupEvents () {
        // need to do this through our own event system
        // need to make sure events are registered with { passive: false } so we can prevent default
    }

    onWheel (event) {
        event.preventDefault(); // Prevent the default scroll behavior

        const delta = Math.sign(event.deltaY);
        const speed = 5; 
        this.camera().position.addInPlace(this.camera().getForwardRay().direction.scale(delta * speed));
        //}, { passive: false }); // Set passive to false to allow preventDefault
    }

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
