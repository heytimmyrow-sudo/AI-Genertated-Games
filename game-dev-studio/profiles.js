$('#profileButton').onclick=openProfileModal;
$('#closeProfileModal').onclick=closeModal;
$('#newProfile').onclick=()=>{state.activeProfileId='';$('#profileName').value='';$('#profileRole').value='';$('#profileColor').value='#8395ff';renderProfiles();$('#profileName').focus()};
$('#profileForm').onsubmit=event=>{event.preventDefault();const name=$('#profileName').value.trim();if(!name)return;const existing=activeProfile(),profile={id:existing?.id||`profile-${Date.now()}`,name,role:$('#profileRole').value.trim(),color:$('#profileColor').value};if(existing)Object.assign(existing,profile);else state.profiles.push(profile);state.activeProfileId=profile.id;save();renderProfileButton();renderProfiles();toast(`${name}'s profile is ready`);closeModal()};
