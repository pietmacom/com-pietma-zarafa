<?php
	/**
	 * Create Mail ItemModule
	 * Module which openes, creates, saves and deletes an item. It
	 * extends the Module class.
	 */
	class CreateMailItemModule extends ItemModule
	{
		/**
		 * Constructor
		 * @param int $id unique id.
		 * @param array $data list of all actions.
		 */
		function CreateMailItemModule($id, $data)
		{
			$this->properties = $GLOBALS['properties']->getMailProperties();

			parent::ItemModule($id, $data);
		}

		/**
		 * Function which saves and/or sends an item.
		 * @param object $store MAPI Message Store Object
		 * @param string $parententryid parent entryid of the message
		 * @param string $entryid entryid of the message
		 * @param array $action the action data, sent by the client
		 * @return boolean true on success or false on failure
		 */
		function save($store, $parententryid, $entryid, $action)
		{
			global $state;
			$result = false;
			$send = false;

			if(!$store) {
				$store = $GLOBALS['mapisession']->getDefaultMessageStore();
			}
			if(!$parententryid) {
				if(isset($action['props']) && isset($action['props']['message_class'])) {
					$parententryid = $this->getDefaultFolderEntryID($store, $action['props']['message_class']);
				} else {
					$parententryid = $this->getDefaultFolderEntryID($store, '');
				}
			}

			if($store) {
				// Reference to an array which will be filled with PR_ENTRYID, PR_STORE_ENTRYID and PR_PARENT_ENTRYID of the message
				$messageProps = array();
				$attachments = !empty($action['attachments']) ? $action['attachments'] : array();
				$recipients = !empty($action['recipients']) ? $action['recipients'] : array();

				// Set message flags first, because this has to be possible even if the user does not have write permissions
				if(isset($action['props']) && isset($action['props']['message_flags']) && $entryid) {
					$msg_action = isset($action['message_action']) ? $action['message_action'] : false;
					$result = $GLOBALS['operations']->setMessageFlag($store, $entryid, $action['props']['message_flags'], $msg_action, $messageProps);

					unset($action['props']['message_flags']);
				}

				$saveChanges = true;
				$send = false;

				if(isset($action['message_action']) && isset($action['message_action']['send'])) {
					$send = $action['message_action']['send'];
				}

				// if we are sending mail then no need to check if anything is modified or not just send the mail
				if(!$send) {
					// If there is any property changed then save
					$saveChanges = !empty($action['props']);

					// Check if we are dealing with drafts and recipients or attachments information is modified
					if(!$saveChanges) {
						// check for changes in attachments
						if(isset($attachments['dialog_attachments'])) {
							$attachment_state = new AttachmentState();
							$attachment_state->open();
							$saveChanges = $attachment_state->isChangesPending($attachments['dialog_attachments']);
							$attachment_state->close();
						}

						// check for changes in recipients info
						$saveChanges = $saveChanges || !empty($recipients);
					}
				}

				// check we should send/save mail
				if($saveChanges) {
					$copyAttachments = false;
					$copyFromStore = false;
					$copyFromMessage = false;
					$copyInlineAttachmentsOnly = false;

					if(isset($action['message_action']) && isset($action['message_action']['action_type'])) {
						$actions = array('reply', 'replyall', 'forward');
						if (array_search($action['message_action']['action_type'], $actions) !== false) {
							/**
							 * we need to copy the original attachments when it is an forwarded message
							 * OR
							 * we need to copy ONLY original inline(HIDDEN) attachments when it is reply/replyall message
							 */
							$copyFromMessage = hex2bin($action['message_action']['source_entryid']);
							$copyFromStore = hex2bin($action['message_action']['source_store_entryid']);
							$copyFromAttachNum = !empty($action['message_action']['source_attach_num']) ? $action['message_action']['source_attach_num'] : false;
							$copyAttachments = true;

							// get resources of store and message
							$copyFromStore = $GLOBALS['mapisession']->openMessageStore($copyFromStore);
							$copyFromMessage = $GLOBALS['operations']->openMessage($copyFromStore, $copyFromMessage, $copyFromAttachNum);

							// Decode smime signed messages on this message
							parse_smime($copyFromStore, $copyFromMessage);

							if ($action['message_action']['action_type'] === 'reply' || $action['message_action']['action_type'] === 'replyall') {
								$copyInlineAttachmentsOnly = true;
							}
						}
					}

					if($send) {
						// Allowing to hook in just before the data sent away to be sent to the client
						$GLOBALS['PluginManager']->triggerHook('server.module.createmailitemmodule.beforesend', array(
							'moduleObject' => $this,
							'store' => $store,
							'entryid' => $entryid,
							'action' =>$action,
							));

						$prop = Conversion::mapXML2MAPI($this->properties, $action['props']);

						$result = $GLOBALS['operations']->submitMessage($store, $entryid, Conversion::mapXML2MAPI($this->properties, $action['props']), $messageProps, isset($action['recipients']) ? $action['recipients'] : array(), isset($action['attachments']) ? $action['attachments'] : array(), $copyFromMessage, $copyAttachments, false, $copyInlineAttachmentsOnly);

						// If draft is sent from the drafts folder, delete notification
						if($result) {
							if(isset($entryid) && !empty($entryid)) {
								$props = array();
								$props[PR_ENTRYID] = $entryid;
								$props[PR_PARENT_ENTRYID] = $parententryid;

								$storeprops = mapi_getprops($store, array(PR_ENTRYID));
								$props[PR_STORE_ENTRYID] = $storeprops[PR_ENTRYID];

								$GLOBALS['bus']->addData($this->getResponseData());
								$GLOBALS['bus']->notify(bin2hex($parententryid), TABLE_DELETE, $props);
							}
							$this->sendFeedback($result ? true : false, array(), false);
						}
					} else {
						$propertiesToDelete = array();
						$mapiProps = Conversion::mapXML2MAPI($this->properties, $action['props']);

						/*
						 * PR_SENT_REPRESENTING_ENTRYID and PR_SENT_REPRESENTING_SEARCH_KEY properties needs to be deleted while user removes 
						 * any previously configured recipient from FROM field.
						 * This property was simply ignored by Conversion::mapXML2MAPI function
						 * as it is configured with empty string in request.
						 */
						if (isset($action['props']['sent_representing_entryid']) && empty($action['props']['sent_representing_entryid'])) {
							array_push($propertiesToDelete, PR_SENT_REPRESENTING_ENTRYID,PR_SENT_REPRESENTING_SEARCH_KEY);
						}

						$result = $GLOBALS['operations']->saveMessage($store, $entryid, $parententryid, $mapiProps, $messageProps, isset($action['recipients']) ? $action['recipients'] : array(), isset($action['attachments']) ? $action['attachments'] : array(), $propertiesToDelete, $copyFromMessage, $copyAttachments, false, $copyInlineAttachmentsOnly);

						// Update the client with the (new) entryid and parententryid to allow the draft message to be removed when submitting.
						// this will also update rowids of attachments which is required when deleting attachments
						$props = array();
						$props = mapi_getprops($result, array(PR_ENTRYID));
						$savedMsg = $GLOBALS['operations']->openMessage($store, $props[PR_ENTRYID]);

						$attachNum = !empty($action['attach_num']) ? $action['attach_num'] : false;

						// If embedded message is being saved currently than we need to obtain all the 
						// properties of 'embedded' message instead of simple message and send it in response
						if($attachNum) {
							$message = $GLOBALS['operations']->openMessage($store, $props[PR_ENTRYID], $attachNum);

							if(empty($message)) {
								return;
							}

							$data['item'] = $GLOBALS['operations']->getEmbeddedMessageProps($store, $message, $this->properties, $savedMsg, $attachNum);
						} else {
							$data = $GLOBALS['operations']->getMessageProps($store, $savedMsg, $this->properties);
						}

						/*
						 * html filter modifies body of the message when opening the message
						 * but we have just saved the message and even if there are changes in body because of html filter
						 * we shouldn't send updated body to client otherwise it will mark it as changed
						 */
						unset($data['props']['body']);
						unset($data['props']['html_body']);
						unset($data['props']['isHTML']);

						$this->addActionData('update', array('item' => $data));
					}

					// Reply/Reply All/Forward Actions (ICON_INDEX & LAST_VERB_EXECUTED)
					// we don't care if we are replying/forwarding from embedded message, as we don't want to save these
					// properties in embedded message
					if($copyFromMessage && $copyFromStore && empty($action['message_action']['source_attach_num'])) {
						$props = array();
						$props[$this->properties['entryid']] = hex2bin($action['message_action']['source_entryid']);

						switch($action['message_action']['action_type'])
						{
							case 'reply':
								$props[$this->properties['icon_index']] = 261;
								$props[$this->properties['last_verb_executed']] = 102;
								break;
							case 'replyall':
								$props[$this->properties['icon_index']] = 261;
								$props[$this->properties['last_verb_executed']] = 103;
								break;
							case 'forward':
								$props[$this->properties['icon_index']] = 262;
								$props[$this->properties['last_verb_executed']] = 104;
								break;
						}

						$props[$this->properties['last_verb_execution_time']] = time();

						$messageActionProps = array();
						$messageActionResult = $GLOBALS['operations']->saveMessage($copyFromStore, $props[PR_ENTRYID], $parententryid, $props, $messageActionProps);

						if($messageActionResult) {
							if(isset($messageActionProps[PR_PARENT_ENTRYID])) {
								$GLOBALS['bus']->notify(bin2hex($messageActionProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageActionProps);
							}
						}
					}
				}

				// Feedback for successful save (without send)
				if($result && !$send) {
					$GLOBALS['bus']->notify(bin2hex($messageProps[PR_PARENT_ENTRYID]), TABLE_SAVE, $messageProps);
				}

				// Feedback for send
				if($send) {
					$this->addActionData('update', array('item' => Conversion::mapMAPI2XML($this->properties, $messageProps)));
				}

				$this->sendFeedback($result ? true : false, array(), true);
			}
		}
	}
?>
