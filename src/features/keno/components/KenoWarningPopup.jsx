import React from 'react';
import './keno-warning-popup.css';

/** Atlas ShowWarning(): a dimmed screen with the message in yellow capitals and a close cross. */
export default function KenoWarningPopup({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="warning_alert_popup" role="alertdialog" aria-modal="true">
      <div className="warning_alert_popup_cont">
        <button type="button" className="close_btn" aria-label="Close" onClick={onClose} />
        <h1 className="warning_alert_popup_info">{message}</h1>
      </div>
    </div>
  );
}
