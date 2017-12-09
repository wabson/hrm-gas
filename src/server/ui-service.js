/**
 * Display a dialog with a link, which the user can close with an OK button
 */
exports.showLinkDialog = function showLinkDialog(title, text, linkHref, linkText, linkTarget, dialogHeight) {
  // Dialog height in pixels
  dialogHeight = dialogHeight||125;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle(title).setHeight(dialogHeight),
    mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");

  mypanel.add(app.createHTML(text));
  mypanel.add(app.createAnchor(linkText||linkHref, linkHref).setTarget(linkTarget||"_blank"));

  var closeButton = app.createButton('OK');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);

  app.add(mypanel);

  ss.show(app);
};

/**
 * Display a dialog, which the user can close with an OK button
 */
exports.showDialog = function showDialog(title, text, dialogHeight) {
  // Dialog height in pixels
  dialogHeight = dialogHeight||125;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle(title).setHeight(dialogHeight),
    mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");

  var scroll = app.createScrollPanel().setWidth('100%').setHeight('100px');
  scroll.add(app.createHTML(text));
  mypanel.add(scroll);

  var closeButton = app.createButton('OK');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);

  app.add(mypanel);

  ss.show(app);
};

/**
 * Handler function for closing a dialog

 * @return {AppInstance} Active application instance
 */
exports.close = function close() {
  var app = UiApp.getActiveApplication();
  app.close();
  // The following line is REQUIRED for the widget to actually close.
  return app;
};