VERSION=0.4.17

TBDIR=build
TDIR=$(TBDIR)/threeRowsDown_${TARGET}
ZIPPER=$(TBDIR)/threeRowsDown-$(TARGET)-$(VERSION).zip
TDIRS=$(TDIR)

# Maybe readme.txt should be readme.md??

SOURCES=$(TDIR) $(TBDIR) \
		$(TDIR)/LICENSE.txt  \
		$(TDIR)/README.txt  \
		$(TDIR)/build.sh  \
		$(TDIR)/manifest.json  \
		$(TDIR)/content.js

all: build all-firefox all-chrome

all-firefox:
	TARGET=firefox $(MAKE) -e TARGET=firefox do-firefox

all-chrome:
	TARGET=chrome $(MAKE) -e TARGET=chrome do-chrome

do-firefox: $(TDIRS) $(ZIPPER)

do-chrome: $(TDIRS) $(SOURCES) 

$(ZIPPER): $(SOURCES)
	cd $(TDIR) ; TARGET=$(TARGET) ./build.sh

build:
	mkdir -p $@

$(TDIR) $(TDIR)/build:
	mkdir -p $@

$(TDIR)/LICENSE.txt : LICENSE.txt
	cp $< $@

$(TDIR)/README.txt : README.txt
	cp $< $@

$(TDIR)/build.sh : build.sh
	cp $< $@
	chmod +x $@

$(TDIR)/manifest.json : manifest.json.erb Makefile
	TARGET=${TARGET} VERSION=${VERSION} ruby -rjson -rerb -e 'File.write("$@", JSON.pretty_generate(JSON.parse(ERB.new(File.read("$<"), trim_mode: 2).result)))'

$(TDIR)/content.js : content.js
	cp $< $@

tarSource: threeRowsDown.tgz

threeRowsDown.tgz: HISTORY.md LICENSE.txt Makefile README.txt PRIVACY.md build.sh manifest.json.erb content.js
	tar cfz $@ $^
