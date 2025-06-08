# Strvct Notes

## Field Subnodes
- You cannot use `setShouldStoreSubnodes()` on a node which uses subnode field slots. The subnode field slots are meant for UI organization and should not be used for data storage.
- If you need to store subnode data, create separate node types instead of using subnode field slots. 