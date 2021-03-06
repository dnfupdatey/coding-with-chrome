/**
 * @fileoverview Connection for the Sphero 2.0 modification.
 *
 * @license Copyright 2015 The Coding with Chrome Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author mbordihn@google.com (Markus Bordihn)
 */
goog.provide('cwc.mode.sphero.classic.Connection');

goog.require('cwc.protocol.sphero.classic.Api');
goog.require('cwc.utils.Events');
goog.require('cwc.utils.Logger');

goog.require('goog.Timer');


/**
 * @constructor
 * @param {!cwc.utils.Helper} helper
 */
cwc.mode.sphero.classic.Connection = function(helper) {
  /** @type {string} */
  this.name = 'Sphero 2.0 Connection';

  /** @type {string} */
  this.autoConnectName = 'Sphero';

  /** @type {!cwc.utils.Helper} */
  this.helper = helper;

  /** @type {goog.Timer} */
  this.connectMonitor = null;

  /** @type {!number} */
  this.connectMonitorInterval = 5000;

  /** @private {!cwc.protocol.sphero.classic.Api} */
  this.api_ = new cwc.protocol.sphero.classic.Api();

  /** @private {!goog.events.EventTarget} */
  this.apiEvents_ = this.api_.getEventHandler();

  /** @private {!cwc.utils.Events} */
  this.events_ = new cwc.utils.Events(this.name);

  /** @private {!cwc.utils.Logger|null} */
  this.log_ = new cwc.utils.Logger(this.name);
};


/**
 * Connects the Sphero unit.
 * @export
 */
cwc.mode.sphero.classic.Connection.prototype.init = function() {
  this.handleConnecting_({
    'data': 'Connecting Sphero 2.0',
    'source': 1,
  });
  if (this.apiEvents_) {
    this.events_.listen(this.apiEvents_,
      cwc.protocol.sphero.v1.Events.Type.CONNECT,
      this.handleConnecting_.bind(this));
  }

  let layoutInstance = this.helper.getInstance('layout');
  if (layoutInstance) {
    this.events_.listen(layoutInstance.getEventHandler(),
        goog.events.EventType.UNLOAD, this.cleanUp, false, this);
  }

  let previewInstance = this.helper.getInstance('preview');
  if (previewInstance) {
    this.events_.listen(previewInstance.getEventHandler(),
      cwc.ui.PreviewEvents.Type.STATUS_CHANGE, this.handlePreviewStatus_,
      false, this);
  }

  if (!this.connectMonitor) {
    this.connectMonitor = new goog.Timer(this.connectMonitorInterval);
    this.events_.listen(this.connectMonitor, goog.Timer.TICK,
      this.connect.bind(this));
  }
  this.connectMonitor.start();
  this.connect();
};


/**
 * Connects the Sphero ball.
 * @param {Event=} opt_event
 * @export
 */
cwc.mode.sphero.classic.Connection.prototype.connect = function(opt_event) {
  if (!this.isConnected()) {
    let bluetoothInstance = this.helper.getInstance('bluetooth', true);
    bluetoothInstance.autoConnectDevice(this.autoConnectName,
      this.api_.connect.bind(this.api_));
  }
  this.api_.monitor(true);
};


/**
 * Stops the current executions.
 */
cwc.mode.sphero.classic.Connection.prototype.stop = function() {
  this.api_.exec('stop');
};


/**
 * @return {!boolean}
 * @export
 */
cwc.mode.sphero.classic.Connection.prototype.isConnected = function() {
  return this.api_.isConnected();
};


/**
 * @return {goog.events.EventTarget}
 */
cwc.mode.sphero.classic.Connection.prototype.getEventHandler = function() {
  return this.api_.getEventHandler();
};


/**
 * @return {!cwc.protocol.sphero.classic.Api}
 * @export
 */
cwc.mode.sphero.classic.Connection.prototype.getApi = function() {
  return this.api_;
};


/**
 * Cleans up the event listener and any other modification.
 */
cwc.mode.sphero.classic.Connection.prototype.cleanUp = function() {
  this.log_.info('Clean up ...');
  if (this.connectMonitor) {
    this.connectMonitor.stop();
  }
  this.api_.cleanUp();
  this.stop();
  this.events_.clear();
};


/**
 * @param {Event|Object} e
 * @private
 */
cwc.mode.sphero.classic.Connection.prototype.handleConnecting_ = function(e) {
  let message = e.data;
  let step = e.source;
  let title = 'Connecting Sphero 2.0';
  let connectScreenInstance = this.helper.getInstance('connectScreen');
  connectScreenInstance.showConnectingStep(title, message, step);
};


/**
 * @param {Event|Object} e
 * @private
 */
cwc.mode.sphero.classic.Connection.prototype.handlePreviewStatus_ = function(
    e) {
  if (e.data === cwc.ui.PreviewState.STOPPED) {
    this.stop();
  }
};
