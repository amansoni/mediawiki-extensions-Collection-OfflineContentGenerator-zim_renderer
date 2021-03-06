# mw-ocg-zimwriter
[![NPM][NPM1]][NPM2]

[![Build Status][1]][2] [![dependency status][3]][4] [![dev dependency status][5]][6]

Converts mediawiki collection bundles (as generated by [mw-ocg-bundler]) to
[ZIM] files.

**NOT YET COMPLETE.**

## Installation

Node version 0.8 and 0.10 are tested to work.

Install the node package dependencies.
```
npm install
```

Install other system dependencies.
```
apt-get install unzip
```

## Generating bundles

You may wish to install the [mw-ocg-bundler] npm package to create bundles
from wikipedia articles.  The below text assumes that you have done
so; ignore the `mw-ocg-bundler` references if you have bundles from
some other source.

## Running

To generate a ZIM file named `us.zim` from the `en.wikipedia.org`
article "United States":
```
$SOMEPATH/bin/mw-ocg-bundler -v -o us.zip -h en.wikipedia.org "United States"
bin/mw-ocg-zimwriter -o us.zim us.zip
```

In the above command `$SOMEPATH` is the place you installed
`mw-ocg-bundler`; if you've used the directory structure recommended
by `mw-ocg-service` this will be `../mw-ocg-bundler`.

For other options, see:
```
bin/mw-ocg-zimwriter --help
```

## Related Projects

* [mw-ocg-bundler][]
* [mw-ocg-latexer][]
* [mw-ocg-texter][]

## License

GPLv2

(c) 2014 by C. Scott Ananian

[mw-ocg-bundler]: https://github.com/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-bundler
[mw-ocg-latexer]: https://github.com/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-latex_renderer
[mw-ocg-texter]: https://github.com/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-text_renderer

[ZIM]: http://en.wikipedia.org/wiki/ZIM_(file_format)

[NPM1]: https://nodei.co/npm/mw-ocg-zimwriter.png
[NPM2]: https://nodei.co/npm/mw-ocg-zimwriter/

[1]: https://travis-ci.org/cscott/mw-ocg-zimwriter.svg
[2]: https://travis-ci.org/cscott/mw-ocg-zimwriter
[3]: https://david-dm.org/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-zim_renderer.svg
[4]: https://david-dm.org/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-zim_renderer
[5]: https://david-dm.org/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-zim_renderer/dev-status.svg
[6]: https://david-dm.org/wikimedia/mediawiki-extensions-Collection-OfflineContentGenerator-zim_renderer#info=devDependencies
