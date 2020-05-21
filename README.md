 __Warning__
> You probably want https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode most of the code in this repo has been incorporated into the official svelte plugin. This repo will live on until the issues are closed and the svelte-native support lands in the official plugin

# Svelte Type Checker

Provides deep type checking for Svelte files by leaning on the Typescript language service.

Requires a Svelte language mode plugin such as [Svelte Beta](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

For best results, disable the typescript complete, hover, and definition features of the Svelte plugin and enable all the settings of this plugin.

### Features provided 

* Type checks regular JS as well as Typescript
* Type checking of component template (including prop types and slots)
* Autocomplete for component props
* Go to definition for components and props
* Hover information for template attributes


### Examples

#### Property Type Checking
![Property Type Checking](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/prop-type-check.png)

#### Property Auto Complete
![Property Completion](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/prop-complete.png)

#### Slot Parameter Checking
![Slot Param Check](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/slot-param-type-check.png)

#### Slot Parameter Info
![Slot Param Info](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/slot-param-info.png)

#### Await Type Checking/Info
![Await Types](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/await-types.png)

#### Store Type Checking/Info
![Store Types](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/store-types.png)

#### Animation Parameter Checking/Info
![Transition Types](https://raw.githubusercontent.com/halfnelson/svelte-type-checker-vscode/master/samples/transition-parameter-types.png)
