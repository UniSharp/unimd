project=$(shell basename `pwd`)


init:
	yarn install

build:
	# ./node_modules/.bin/gulp
	yarn build

watch:
	yarn dev
