import Ractive from 'ractive'

const Modal = Ractive.extend({
  el: '.interactive-container',
  append: true,
  onrender: function () {
    var self = this, resizeHandler;

    // store references to the background, and to the modal itself
    // we'll assume we're in a modern browser and use querySelector
    this.outer = this.find( '.modal-outer' );
    this.modal = this.find( '.modal' );

    // if the user taps on the background, close the modal
    this.on( 'bg-close', function ( event ) {
      if ( !this.modal.contains( event.original.target ) ) {
        this.teardown();
      }
    });

    this.on( 'close', function ( event ) {
      this.teardown();
    });

    // when the window resizes, keep the modal horizontally and vertically centred
    window.addEventListener( 'resize', resizeHandler = function () {
      self.center();
    }, false );

    // clean up after ourselves later
    this.on( 'teardown', function () {
      if (this.modal.id != "report-modal") {

        if ( window.self !== window.top ) {
           //iframeMessenger.navigate('')
        } else {
            history.pushState("", document.title, window.location.pathname)
        }

      }

      window.removeEventListener( 'resize', resizeHandler );
    }, false );

    // manually call this.center() the first time
    this.center();
  },

  center: function () {
    var outerHeight, modalHeight, verticalSpace;

    // horizontal centring is taken care of by CSS, but we need to
    // vertically centre
    outerHeight = this.outer.clientHeight;
    modalHeight = this.modal.clientHeight;

    verticalSpace = ( outerHeight - modalHeight ) / 2;

    this.modal.style.top = verticalSpace + 'px';
  }
});

export default Modal