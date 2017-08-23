project=$(shell basename `pwd`)


init: yarn install

build:
	# ./node_modules/.bin/gulp
	yarn dev

watch:
	yarn watch
