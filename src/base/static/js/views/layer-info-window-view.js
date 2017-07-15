/* A view for managing tooltip layer info windows */

import React, { Component } from "react";

class LayerInfoWindowView extends Component {

  componentWillMount () {
    this.props.sidebar.on("closing", () => { this.props.setInfowWindowVisibility(false) }, this);
    this.props.sidebar.on("content", () => { this.props.setInfowWindowVisibility(false) }, this);
  }

  onInfoWindowClose (evt) {
    evt.preventDefault();
    this.props.setInfowWindowVisibility(false);
  }

  render () {
    return (
      <div>
        <div className="caret-left"></div>
        <div className="layer-info-window-content">
          <div className="info-window-header">
            <div className="info-window-close-btn" onClick={this.onInfoWindowClose.bind(this)}>&#10005;</div>
            <div className="info-window-title">{this.props.title}</div>
            <hr />
          </div>
          <div className="info-window-body-container">
            <div className="info-window-body">{this.props.body}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default LayerInfoWindowView;


// NOTE: original Backbone view left for reference

// module.exports = Backbone.View.extend({
//   events: {
//     "click .info-window-close-btn": "onClickCloseWindowBtn",
//   },

//   initialize: function() {
//     this.state = new Backbone.Model({
//       body: "",
//       title: "",
//       top: 0,
//       left: 0,
//       isVisible: false
//     });

//     this.options.sidebar.on("closing", this.onClickCloseWindowBtn, this);
//     this.options.sidebar.on("content", this.onClickCloseWindowBtn, this);
//     this.state.on("change:isVisible", this.onVisibilityChange, this);

//     return this;
//   },

//   setState: function(content = {}) {
//     for (let prop in content) {
//       this.state.set(prop, content[prop]);
//     }
//     this.state.set("isVisible", !this.state.get("isVisible"));

//     this.render();
//   },

//   hide: function() {
//     this.state.set("isVisible", false);
//   },

//   onVisibilityChange: function() {
//     (this.state.get("isVisible"))
//       ? this.$el.removeClass("is-hidden-fadeout")
//       : this.$el.addClass("is-hidden-fadeout");
//   },

//   onClickCloseWindowBtn: function() {
//     this.state.set("isVisible", false);
//   },

//   render: function() {
//     let data = {
//       title: this.state.get("title"),
//       body: this.state.get("body")
//     };

//     this.$el
//       .html(Handlebars.templates["layer-info-window"](data))
//       .css({
//         top: this.state.get("top") - (this.$el.height() / 2),
//         left: this.state.get("left")
//       });
//   }
// });
