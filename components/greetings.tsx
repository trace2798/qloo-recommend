// import { motion } from "framer-motion";

// const options = [
//   "Recommend me a movie similar to Good Will Hunting.",
//   "Recommend me something like To Kill a Mockingbird to read.",
//   "Suggest me something like Breaking Bad.",
//   "Suggest me something similar to Yves Saint Laurent.",
// ];

// export const Greeting = () => {
//   return (
//     <div
//       key="overview"
//       className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
//     >
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: 10 }}
//         transition={{ delay: 0.5 }}
//         className="text-2xl font-semibold"
//       >
//         Hello there!
//       </motion.div>
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: 10 }}
//         transition={{ delay: 0.6 }}
//         className="text-2xl text-zinc-500"
//       >
//         How can I help you today?
//       </motion.div>

//       <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
//         {options.map((text, index) => (
//           <motion.button
//             key={index}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             className="rounded-xl border text-left px-4 py-3 text-sm  shadow-md transition hover:cursor-pointer hover:bg-accent"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.7 + index * 0.1 }}
//             onClick={() => {
//               // Replace this with your sendMessage logic
//               console.log(text);
//             }}
//           >
//             {text}
//           </motion.button>
//         ))}
//       </div>
//     </div>
//   );
// };
import { motion } from "framer-motion";

const options = [
  "Recommend me a movie similar to Good Will Hunting.",
  "Recommend me something like To Kill a Mockingbird to read.",
  "Suggest me something like Breaking Bad.",
  "Suggest me something similar to Yves Saint Laurent.",
];

export const Greeting = ({
  sendMessage,
  setMessages,
}: {
  sendMessage: (msg: {
    role: "user";
    parts: { type: "text"; text: string }[];
  }) => void;
  setMessages: Function;
}) => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center gap-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Hello there!
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        How can I help you today?
      </motion.div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((text, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border text-primary/80 text-left px-4 py-3 text-sm  shadow-md transition hover:cursor-pointer hover:bg-accent hover:text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            onClick={() => {
              sendMessage({
                role: "user",
                parts: [{ type: "text", text }],
              });
            }}
          >
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
