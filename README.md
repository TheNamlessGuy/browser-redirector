# browser-redirector
A firefox plugin for general URL redirection using regexes. Manual and automatic!

## Get
### Manual download
Download the .xpi file from the latest [release](https://github.com/TheNamlessGuy/browser-redirector/releases).  
Drag and drop the file into your Firefox instance to install it.

### From Firefox AMO
The download page is [here](https://addons.mozilla.org/firefox/addon/namless-redirector/)

## Usage
The plugin allows you to redirect from one URL to another. For example, you might be like me and hate the youtube shorts page. With one of the default options, all shorts pages get redirected to the proper view page (this can of course be removed or changed).  
You can also block access to pages completely, which - again, per default - the plugin does with reddit.  
The above two options exist to show you how to work the plugin, really. Just visit the plugin option page when you've installed the plugin, and you should get it no problem, as long as you know regex.

One thing to note however, is that it might take a little while on boot to properly load all your regexes (if you have a LOT). You should be able to see this process by the little loading icon in your browser URL bar, while the processing is going on.

### Function calls
Sometimes, you might want to format the input data to look slightly different. This can be done through function calls. For example:
```
https://www.google.com/search?q=+ABCDEF+
```
with the rule:
```
FROM: ^(http|https)://(www\\.)?google.com/search?q=(.+)
TO: {{1}}://{{2}}google.com/search?q={{3:trim(+):lowercase}}
```
will result in the URL:
```
https://www.google.com/search?q=abcdef
```

#### Available functions
* `lowercase`  
    Transforms the match to lowercase (AbC => abc)
* `uppercase`  
    Transforms the match to uppercase (aBc => ABC)
* `encode`  
    Maps directly to the builtin JS function [encodeURIComponent](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
* `decode`  
    Maps directly to the builtin JS function [decodeURIComponent](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)
* `ltrim(c)`  
    Removes the given character `c` from the left side of the match (`ltrim(+)` on `+++abc+++` => `abc+++`)
* `rtrim(c)`  
    Removes the given character `c` from the right side of the match (`rtrim(+)` on `+++abc+++` => `+++abc`)
* `trim(c)`  
    Removes the given character `c` from the left and right side of the match (`trim(+)` on `+++abc+++` => `abc`)

## Cross-hosted
This repository is hosted both on [GitHub](https://github.com/TheNamlessGuy/browser-redirector) and [Codeberg](https://codeberg.org/TheNamlessGuy/browser-redirector).
