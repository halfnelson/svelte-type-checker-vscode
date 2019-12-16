require('source-map-support')

const util = require('../out/util')
let { assert } = require('chai')

describe('util', () => {

	describe("#uriToFilePath", () => {
		it("Can convert a windows uri to typescript compatible path", () => {
			let path = "file:///c%3A/dev/svelte/test-app/src/Test.svelte"
			assert.equal(util.uriToFilePath(path), "c:/dev/svelte/test-app/src/Test.svelte")
		})

		it("Can convert a posix uri to typescript compatible path", () => {
			let path = "file:///user/svelte/test-app/src/Test.svelte"
			assert.equal(util.uriToFilePath(path), "/user/svelte/test-app/src/Test.svelte")
		})
	})

	describe("#filePathToUri", () => {
		it("Can convert a windows path to uri", () => {
			let path = "c:\\dev\\svelte\\test-app\\src\\Test.svelte"
			assert.equal(util.filePathToUri(path), "file:///c%3A/dev/svelte/test-app/src/Test.svelte")
		})

		it("Can convert a windows path with forward slashes to uri", () => {
			let path = "c:/dev/svelte/test-app/src/Test.svelte"
			assert.equal(util.filePathToUri(path), "file:///c%3A/dev/svelte/test-app/src/Test.svelte")
		})

		it("Can convert a posix path to uri", () => {
			let path = "/user/svelte/test-app/src/Test.svelte"
			assert.equal(util.filePathToUri(path), "file:///user/svelte/test-app/src/Test.svelte")
		})
	})
});