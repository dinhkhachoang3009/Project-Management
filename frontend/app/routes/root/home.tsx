import React from "react";
import type { Route } from "../../+types/root";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TaskManager" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const Homepage = () => {
  return <div>Homepage</div>;
};

export default Homepage;
