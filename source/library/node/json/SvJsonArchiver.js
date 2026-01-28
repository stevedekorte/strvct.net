"use strict";

/*
    @module app/json
    @class SvJsonArchiver
    @extends SvSummaryNode
    @classdesc For serializing and unserializing JSON <-> objects.

    Notes:
    - object assumed to be in a directed graph
    - multiple "views" of the object are supported via slot annotation filtering
        e.g. a view for cloud storage, a view for AI-visible data, etc.
    - it manages the tracting of pathComponents for the json path

    Example Serialization Usage:
    ```
    const ja = SvJsonArchiver.clone();
    ja.setFilterByAnnotationName("isInAiJsonSchema");
    ja.setRootObject(rootObject);
    ja.serialize();
    const aiJson = ja.json();
    ```

    Example Deserialization Usage:
    ```
    const ja = SvJsonArchiver.clone();
    ja.setFilterByAnnotationName("isInAiJsonSchema");
    ja.setJson(aiJson);

    // optionally, we can set the root object before deserializing
    // and it will apply the root JSON to the root object instead of creating a new one
    ja.setRootObject(rootObject);

    ja.deserialize();
    const rootObject = ja.rootObject();
    ```

    Further notes:

    - I recommend subclassing JsonArchiver to set the filterByAnnotationName.

    For example:
    ```
    class AiJsonArchiver extends SvJsonArchiver {
        initPrototype () {
            super.initPrototype();
            this.setFilterByAnnotationName("isInAiJsonSchema");
        }
    }
    ```

    Key classes:

    SvJsonNode: The base class for all JSON nodes.
    SvJsonGroupNode: The base class for all JSON group nodes.
    SvJsonArrayNode: The base class for all JSON array nodes.


*/

(class SvJsonArchiver extends SvSummaryNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("rootObject", null); // used for top level of json patches
            slot.setSlotType("SvJsonNode");
        }

        {
            const slot = this.newSlot("json", null); // used for top level of json patches
            slot.setSlotType("JSON Object");
        }

        {
            const slot = this.newSlot("filterByAnnotationName", "isInJsonSchema");
            slot.setSlotType("String");
            slot.setDescription("The name of the slot annotation to use for filtering.");
        }

    }

    initPrototype () {
        /*
        this.setSummaryFormat("key value");
        this.setHasNewlineAfterSummary(true);
        this.setHasNewLineSeparator(true);
        this.setNodeSubtitleIsChildrenSummary(true);
        this.setShouldStoreSubnodes(false); //default to just slots.  Subclasses can override.
        this.setNodeCanEditTitle(false);
        */
    }

    serialize () {
        assert(this.rootObject(), "rootObject is required");
        this.rootObject().serializeToJson(this.filterByAnnotationName(), []);
    }

    deserialize () {
        assert(this.json(), "json is required");
        this.rootObject().deserializeFromJson(this.filterByAnnotationName(), this.json(), []);
    }

}.initThisClass());
