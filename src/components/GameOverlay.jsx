import React from 'react';

const GameOverlay = ({ score, speedBoostDuration }) => {
    return (
        <div id="gameInfo">
            <div id="score">Score: {score}</div>
            <div id="health">Boost: {speedBoostDuration}</div>
        </div>
    );
};

export default GameOverlay;
