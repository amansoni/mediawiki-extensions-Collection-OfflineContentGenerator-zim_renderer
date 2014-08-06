NOTES from wikimania 2014

Tools from code.kwix.org, click on 'other'.

http://sourceforge.net/p/kiwix/other/ci/master/tree/mwoffliner/mwoffliner.js
http://sourceforge.net/p/kiwix/other/ci/master/tree/zimwriterfs/

Check redirects --- mw-ocg-bundler should be sure to save them.
zimwriterfs looks for files with specially formatted HTML <meta> redirects,
but it's sufficient for bundler to just store the parsoid source for the
redirect in the `parsoid.db` (and follow the link to store the other
file as well).

Port this bit of code, especially the tweaking part:
http://sourceforge.net/p/kiwix/other/ci/master/tree/mwoffliner/mwoffliner.js

Take a bundle as input, rearrange its filesystem, then pass it off to
zimwriterfs.

zimwriterfs will probably need to be packaged, but libzim, etc should
already be packaged.
