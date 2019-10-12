all: chrome firefox

chrome: fetch
	./scripts/build-target chrome

firefox: fetch
	./scripts/build-target firefox

chrome-web-store: fetch
	mkdir -p build/chrome-web-store
	inkscape --without-gui packages/suckless.svg --export-png build/chrome-web-store/icon.png --export-width 128 --export-height 128

fetch:
	./fetch

clean:
	rm -Rf build packages target

.PHONY: build fetch
