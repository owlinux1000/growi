import React from 'react';
import PropTypes from 'prop-types';

import AbstractEditor from './AbstractEditor';
import CodeMirrorEditor from './CodeMirrorEditor';
import TextAreaEditor from './TextAreaEditor';

import Dropzone from 'react-dropzone';

import pasteHelper from './PasteHelper';

export default class Editor extends AbstractEditor {

  constructor(props) {
    super(props);

    this.state = {
      dropzoneActive: false,
      isUploading: false,
    };

    this.getEditorSubstance = this.getEditorSubstance.bind(this);

    this.pasteFilesHandler = this.pasteFilesHandler.bind(this);

    this.dragEnterHandler = this.dragEnterHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.dropHandler = this.dropHandler.bind(this);

    this.getDropzoneAccept = this.getDropzoneAccept.bind(this);
    this.getDropzoneClassName = this.getDropzoneClassName.bind(this);
    this.renderDropzoneOverlay = this.renderDropzoneOverlay.bind(this);
  }

  componentDidMount() {
    // initialize caret line
    this.setCaretLine(0);
  }

  getEditorSubstance() {
    return this.props.isMobile
      ? this.refs.taEditor
      : this.refs.cmEditor;
  }

  /**
   * @inheritDoc
   */
  forceToFocus() {
    this.getEditorSubstance().forceToFocus();
  }

  /**
   * @inheritDoc
   */
  setValue(newValue) {
    this.getEditorSubstance().setValue(newValue);
  }

  /**
   * @inheritDoc
   */
  setGfmMode(bool) {
    this.getEditorSubstance().setGfmMode(bool);
  }

  /**
   * @inheritDoc
   */
  setCaretLine(line) {
    this.getEditorSubstance().setCaretLine(line);
  }

  /**
   * @inheritDoc
   */
  setScrollTopByLine(line) {
    this.getEditorSubstance().setScrollTopByLine(line);
  }

  /**
   * @inheritDoc
   */
  insertText(text) {
    this.getEditorSubstance().insertText(text);
  }

  /**
   * remove overlay and set isUploading to false
   */
  terminateUploadingState() {
    this.setState({
      dropzoneActive: false,
      isUploading: false,
    });
  }

  /**
   * dispatch onUpload event
   */
  dispatchUpload(files) {
    if (this.props.onUpload != null) {
      this.props.onUpload(files);
    }
  }

  pasteFilesHandler(event) {
    const dropzone = this.refs.dropzone;
    const items = event.clipboardData.items || event.clipboardData.files || [];

    // abort if length is not 1
    if (items.length != 1) {
      return;
    }

    const file = items[0].getAsFile();
    // check type and size
    if (pasteHelper.fileAccepted(file, dropzone.props.accept) &&
        pasteHelper.fileMatchSize(file, dropzone.props.maxSize, dropzone.props.minSize)) {

      this.dispatchUpload(file);
      this.setState({ isUploading: true });
    }
  }

  dragEnterHandler(event) {
    const dataTransfer = event.dataTransfer;

    // do nothing if contents is not files
    if (!dataTransfer.types.includes('Files')) {
      return;
    }

    this.setState({ dropzoneActive: true });
  }

  dragLeaveHandler() {
    this.setState({ dropzoneActive: false });
  }

  dropHandler(accepted, rejected) {
    // rejected
    if (accepted.length != 1) { // length should be 0 or 1 because `multiple={false}` is set
      this.setState({ dropzoneActive: false });
      return;
    }

    const file = accepted[0];
    this.dispatchUpload(file);
    this.setState({ isUploading: true });
  }

  getDropzoneAccept() {
    let accept = 'null';    // reject all
    if (this.props.isUploadable) {
      if (!this.props.isUploadableFile) {
        accept = 'image/*'; // image only
      }
      else {
        accept = '';        // allow all
      }
    }

    return accept;
  }

  getDropzoneClassName() {
    let className = 'dropzone';
    if (!this.props.isUploadable) {
      className += ' dropzone-unuploadable';
    }
    else {
      className += ' dropzone-uploadable';

      if (this.props.isUploadableFile) {
        className += ' dropzone-uploadablefile';
      }
    }

    // uploading
    if (this.state.isUploading) {
      className += ' dropzone-uploading';
    }

    return className;
  }

  getOverlayStyle() {
    return {
      position: 'absolute',
      zIndex: 4,  // forward than .CodeMirror-gutters
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  renderDropzoneOverlay() {
    const overlayStyle = this.getOverlayStyle();

    return (
      <div style={overlayStyle} className="overlay">
        {this.state.isUploading &&
          <span className="overlay-content">
            <div className="speeding-wheel d-inline-block"></div>
            <span className="sr-only">Uploading...</span>
          </span>
        }
        {!this.state.isUploading && <span className="overlay-content"></span>}
      </div>
    );
  }

  render() {
    const flexContainer = {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    };

    const isMobile = this.props.isMobile;

    return <React.Fragment>
      <div style={flexContainer}>
        <Dropzone
            ref="dropzone"
            disableClick
            disablePreview={true}
            accept={this.getDropzoneAccept()}
            className={this.getDropzoneClassName()}
            acceptClassName="dropzone-accepted"
            rejectClassName="dropzone-rejected"
            multiple={false}
            onDragLeave={this.dragLeaveHandler}
            onDrop={this.dropHandler}
          >

          { this.state.dropzoneActive && this.renderDropzoneOverlay() }

          {/* for PC */}
          { !isMobile &&
            <CodeMirrorEditor
              ref="cmEditor"
              onPasteFiles={this.pasteFilesHandler}
              onDragEnter={this.dragEnterHandler}
              {...this.props}
            />
          }

          {/* for mobile */}
          { isMobile &&
            <TextAreaEditor
              ref="taEditor"
              onPasteFiles={this.pasteFilesHandler}
              onDragEnter={this.dragEnterHandler}
              {...this.props}
            />
          }

        </Dropzone>

        <button type="button" className="btn btn-default btn-block btn-open-dropzone"
          onClick={() => {this.refs.dropzone.open()}}>

          <i className="icon-paper-clip" aria-hidden="true"></i>&nbsp;
          Attach files by dragging &amp; dropping,&nbsp;
          <span className="btn-link">selecting them</span>,&nbsp;
          or pasting from the clipboard.
        </button>

      </div>

    </React.Fragment>;
  }

}

Editor.propTypes = Object.assign({
  isMobile: PropTypes.bool,
  isUploadable: PropTypes.bool,
  isUploadableFile: PropTypes.bool,
  emojiStrategy: PropTypes.object,
  onChange: PropTypes.func,
  onUpload: PropTypes.func,
}, AbstractEditor.propTypes);

