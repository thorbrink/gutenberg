/**
 * External dependencies
 */
import { castArray, first, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { cloneBlock, hasBlockSupport } from '@wordpress/blocks';

function BlockActions( {
	canDuplicate,
	canInsertDefaultBlock,
	children,
	isLocked,
	onDuplicate,
	onInsertAfter,
	onInsertBefore,
	onRemove,
} ) {
	return children( {
		canDuplicate,
		canInsertDefaultBlock,
		isLocked,
		onDuplicate,
		onInsertAfter,
		onInsertBefore,
		onRemove,
	} );
}

export default compose( [
	withSelect( ( select, props ) => {
		const {
			canInsertBlockType,
			getBlockRootClientId,
			getBlocksByClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const { getDefaultBlockName } = select( 'core/blocks' );

		const blocks = getBlocksByClientId( props.clientIds );
		const canDuplicate = every( blocks, ( block ) => {
			return !! block && hasBlockSupport( block.name, 'multiple', true );
		} );
		const rootClientId = getBlockRootClientId( props.clientIds[ 0 ] );
		const canInsertDefaultBlock = canInsertBlockType(
			getDefaultBlockName(),
			rootClientId
		);

		return {
			blocks,
			canDuplicate,
			canInsertDefaultBlock,
			extraProps: props,
			isLocked: !! getTemplateLock( rootClientId ),
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, props, { select } ) => {
		const {
			clientIds,
			rootClientId,
			blocks,
			isLocked,
			canDuplicate,
		} = props;

		const {
			insertBlocks,
			multiSelect,
			removeBlocks,
			insertDefaultBlock,
		} = dispatch( 'core/block-editor' );

		return {
			onDuplicate() {
				if ( isLocked || ! canDuplicate ) {
					return;
				}

				const { getBlockIndex } = select( 'core/block-editor' );
				const lastSelectedIndex = getBlockIndex( last( castArray( clientIds ) ), rootClientId );
				const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
				insertBlocks(
					clonedBlocks,
					lastSelectedIndex + 1,
					rootClientId
				);
				if ( clonedBlocks.length > 1 ) {
					multiSelect(
						first( clonedBlocks ).clientId,
						last( clonedBlocks ).clientId
					);
				}
			},
			onRemove() {
				if ( ! isLocked ) {
					removeBlocks( clientIds );
				}
			},
			onInsertBefore() {
				if ( ! isLocked ) {
					const { getBlockIndex } = select( 'core/block-editor' );
					const firstSelectedIndex = getBlockIndex( first( castArray( clientIds ) ), rootClientId );
					insertDefaultBlock( {}, rootClientId, firstSelectedIndex );
				}
			},
			onInsertAfter() {
				if ( ! isLocked ) {
					const { getBlockIndex } = select( 'core/block-editor' );
					const lastSelectedIndex = getBlockIndex( last( castArray( clientIds ) ), rootClientId );
					insertDefaultBlock( {}, rootClientId, lastSelectedIndex + 1 );
				}
			},
		};
	} ),
] )( BlockActions );
