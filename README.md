# Git Angular

Forked from Jim Burbridge's [Git Angular](https://gitlab.com/jhechtf/git-angular)

Git Angular is an extension to help you use [Angular style commit messages](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format) in your projects. I occasionally had issue trying to remember some of the options, so I created this largely for myself, but if anyone else wants to use, the more the merrier.

## Features

1. Helps users stay in Angular-style commits. 
2. Configurations can be user-wide or workspace specific.
3. Configurations are simple arrays, so they can be shared easily between teams for a unified setup.
4. Settings can be altered globally or in the workspace.

## Extension Settings

This extension contributes 4 settings:

* **gitAngular.types**<br>
  A string array of the allowed types for a commit to be. Defaults to the list provided
* **gitAngular.scopes**<br>
  A string array of the allowed scopes for the commit message.
* **gitAngular.allowNewTypes**<br>
  A boolean (true/false) value on whether or not to allow the user to add new commit types when making a commit. New types will be saved to the workplace's settings.
* **gitAngular.allowNewScopes**<br>
  A boolean (true/false) value on whether or not to allow the user to add new scopes when making a commit. New scopes will be saved to the workplace's settings.

## Commands

The extension only provides one command `gitAngular.commit`, but does not contribute any keybindings. This was purposeful, as in dealing with some other extensions it bothers me when an extension overrides a keybinding I may be using. If you would like to follow my personal keybinding, I bind this to `ctrl+shift+c` (c for Commit). Recently VSCode has added in a command for that same keybinding, so you may have to disable or change it if you want to use `ctrl+shift+c`.

## Known Issues

1. Since I use API provided by VSCode's API, currently there is a limitation involving workspaces that have multiple git repositories. The extension gives you some UI to choose which repository a commit will be for, but unfortunately I am not able to control programmatically which repository will show up when the SCM view is opened. 

## Bugs / Requests

You can find the issues for this extension at https://github.com/HebelHuber/git-angular/issues

## Notes

This is the very beginning of this extension, and it is possible that I might change the format of how the scopes/types are stored (thinking about using an object so that I might add a description). Just know that if you use this, in a future I may note that we are no longer using pure arrays.

LOL!