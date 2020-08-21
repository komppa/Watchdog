import * as React from "react";
import { motion } from "framer-motion";

const Example = () => {
  return <motion.div className={"testClass"} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }} />;
};

export default Example
