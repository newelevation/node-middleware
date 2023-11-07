const duration = (n) => async (i, o) => {
  try {
    console.time("duration");

    return await n(i, o);
  } finally {
    console.timeEnd("duration");
  }
};

module.exports.duration = duration;
