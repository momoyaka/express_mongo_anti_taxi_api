
const AcceptedRoles = ["ROLE_PASSENGER","ROLE_DRIVER","ROLE_ADMIN"];
const UserStates = ["FREE","ON_TRACK_WAITING","ON_TRACK"];
const TrackStates = ["WAITING_PASSENGER","WAITING_DEPARTURE", "ACTIVE", "FINISHED"]

const UserRole = {
    PASSENGER: 'ROLE_PASSENGER',
    DRIVER: 'ROLE_DRIVER',
    ADMIN: 'ROLE_ADMIN'
  };

const UserState = {
    FREE:'FREE',
    ON_TRACK_WAITING:"ON_TRACK_WAITING",
    ON_TRACK:"ON_TRACK"
}

const TrackState = {
    WAITING_PASSENGER:"WAITING_PASSENGER",
    WAITING_DEPARTURE:"WAITING_DEPARTURE",
    ACTIVE: "ACTIVE", 
    FINISHED:"FINISHED"
}



module.exports = {AcceptedRoles,UserStates,TrackStates, UserRole, UserState, TrackState};
