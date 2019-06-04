/**
 * External dependencies
 */
const { basename } = require( 'path' );

/**
 * Internal dependencies
 */
const { getCliArgs, getCliFileArgs, hasCliArg, hasFileInCliArgs } = require( './cli' );
const { fromConfigRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );

const hasBabelConfig = () =>
	hasProjectFile( '.babelrc' ) ||
	hasProjectFile( '.babelrc.js' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasPackageProp( 'babel' );

const hasJestConfig = () =>
	hasCliArg( '-c' ) ||
	hasCliArg( '--config' ) ||
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasPackageProp( 'jest' );

const hasWebpackConfig = () => hasCliArg( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

/**
 * Converts CLI arguments to the format which webpack understands.
 * It allows to optionally pass some additional webpack CLI arguments.
 *
 * @see https://webpack.js.org/api/cli/#usage-with-config-file
 *
 * @param {?Array} additionalArgs The list of additional CLI arguments.
 *
 * @return {Array} The list of CLI arguments to pass to webpack CLI.
 */
const getWebpackArgs = ( additionalArgs = [] ) => {
	let webpackArgs = getCliArgs();

	const hasWebpackOutputOption = hasCliArg( '-o' ) || hasCliArg( '--output' );
	if ( hasFileInCliArgs() && ! hasWebpackOutputOption ) {
		/**
		 * Converts a path to the entry format supported by webpack, e.g.:
		 * `./entry-one.js` -> `entry-one=./entry-one.js`
		 * `entry-two.js` -> `entry-two=./entry-two.js`
		 *
		 * @param {string} path The path provided.
		 *
		 * @return {string} The entry format supported by webpack.
		 */
		const pathToEntry = ( path ) => {
			const entry = basename( path, '.js' );

			if ( ! path.startsWith( './' ) ) {
				path = './' + path;
			}

			return [ entry, path ].join( '=' );
		};

		// The following handles the support for multiple entry points in webpack, e.g.:
		// `wp-scripts build one.js two.js` -> `webpack one=./one.js two=./two.js`
		webpackArgs = webpackArgs.map( ( cliArg ) => {
			if ( getCliFileArgs().includes( cliArg ) && ! cliArg.includes( '=' ) ) {
				return pathToEntry( cliArg );
			}

			return cliArg;
		} );
	}

	if ( ! hasWebpackConfig() ) {
		webpackArgs.push( '--config', fromConfigRoot( 'webpack.config.js' ) );
	}

	webpackArgs.push( ...additionalArgs );

	return webpackArgs;
};

module.exports = {
	getWebpackArgs,
	hasBabelConfig,
	hasJestConfig,
};
