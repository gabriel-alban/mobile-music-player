import { useQuery } from "@tanstack/react-query";

export const trackApi = {
  useList: () => {
    return useQuery({
      queryKey: ["tracks"],
      queryFn: async () => {
        const res = await fetch(
          "https://songs-server-77f8c19e00d5.herokuapp.com/api/songs",
        );
        if (!res.ok) throw new Error("Failed to load tracks");
        return res.json();
      },
    });
  },
};
