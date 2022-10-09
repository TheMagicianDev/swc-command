# SWC-COMMAND

![swc command cli node api banner](./imgs/)

[npm](), [repo]()

SWC nodejs api to run swc cli seamlessly from node. Intended for main usage with programmatic build scripts.

Many times we find ourselves need to write a build script instead of just configuration. Example combining dev build with launching electron ....

Some also like that for the flexibility of the programmatic side.

Whatever it is. This package and module is intended for this usage. It allow you to run swc-cli through a simple and concise api. Typed with typescript. Autocompletion. And the package provide 3 versions `swc` child process version, `pswc` promise version, `swcSync` a synchronous version.

### CliOptions and properties Warning

Make sure you pass an object that hold the exact supported properties of the cli.

If any one is missing from the typescript declarations. Please fill a pr to add it.

And for flexibility reason. You can add any prop. Even if it's not in the typescript declarations. And because of that choice. We do have a requirement!

Requirement:

- The cli options object. Should contain only the cli args props. And the one that are part of the typescript declaration.
So if you constructed an object that contain all the necessary for the cli execution. But some extra prop. You need to extract that out. Otherwise the command would fail. As it will take the prop as a cli arg. And that would make the cli to fail.

