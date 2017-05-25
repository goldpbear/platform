module.exports = Backbone.View.extend({
  events: {
    'click .subheader-nav-item': 'onSubheaderNavCilck'
  },

  initialize: function() {
    this.currentStory;

    this.render = this.render.bind(this);
    this.onStoryChange = this.onStoryChange.bind(this);
    this.onOffStoryChange = this.onOffStoryChange.bind(this);
    $(document).on("mapseed:story-content-loaded", this.render);
    $(document).on("mapseed:story-change", this.onStoryChange);
    $(document).on("mapseed:off-story-change", this.onOffStoryChange);
  },

  render: function() {
    var data = {
      storyConfig: this.options.storyConfig,
      subheaderMsg: this.options.appConfig.subheader_msg,
      subheaderGraphic: this.options.appConfig.subheader_graphic_url
    };

    this.$el.html(Handlebars.templates["subheader"](data));
  },

  onSubheaderNavCilck: function(evt) {
    this.setNavHighlighting(evt.target);
  },

  setNavHighlighting: function(target) {
    this.$(target)
      .addClass("selected")
      .parent()
      .siblings()
      .find("a")
      .removeClass("selected");
  },

  onStoryChange: function(evt, storyCollectionName) {
    if (storyCollectionName !== this.currentStory) {
      this.setNavHighlighting("." + storyCollectionName);
      this.currentStory = storyCollectionName;
    }
  },

  onOffStoryChange: function() {
    this.currentStory = undefined;

    this.$el
      .find("a")
      .removeClass("selected");
  }

});

